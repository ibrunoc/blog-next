import Link from 'next/link'
import Header from '../../components/header'

import blogStyles from '../../styles/blog.module.css'
import sharedStyles from '../../styles/shared.module.css'

import {
  getBlogLink,
  getDateStr,
  postIsPublished,
} from '../../lib/blog-helpers'
import { textBlock } from '../../lib/notion/renderers'
import getNotionUsers from '../../lib/notion/getNotionUsers'
import getBlogIndex from '../../lib/notion/getBlogIndex'

export async function getStaticProps({ preview }) {
  const postsTable = await getBlogIndex()

  const authorsToGet: Set<string> = new Set()
   const posts: any[] = Object.keys(postsTable)
    .map((slug) => {
      const post = postsTable[slug]

      if (!preview && !postIsPublished(post)) {
        return null
      }

      post.Authors = post.Authors || []
      for (const author of post.Authors) {
        authorsToGet.add(author)
      }

      // ✅ Apenas usamos a URL do Notion diretamente
      if (
        post.Image &&
        typeof post.Image === 'string' &&
        post.Image.startsWith('http')
      ) {
        post.Image = post.Image // URL já válida do Cloudinary
      } else {
        post.Image = null // Sem imagem válida
      }

      return post
    })
    .filter(Boolean)

  const { users } = await getNotionUsers([...authorsToGet])

  posts.map((post) => {
    post.Authors = post.Authors.map((id) => users[id].full_name)
  })

  console.log('Posts processados:', posts) // ✅ Verifique se as URLs estão corretas no console

  return {
    props: {
      preview: preview || false,
      posts,
    },
    revalidate: 600, // 🔥 Atualiza os dados a cada 10 minutos para garantir imagens sempre válidas
  }
}

const Index = ({ posts = [], preview }) => {
  return (
    <>
      <Header titlePre="Blog" />
      {preview && (
        <div className={blogStyles.previewAlertContainer}>
          <div className={blogStyles.previewAlert}>
            <b>Note:</b>
            {` `}Viewing in preview mode{' '}
            <Link href={`/api/clear-preview`}>
              <button className={blogStyles.escapePreview}>Exit Preview</button>
            </Link>
          </div>
        </div>
      )}
      <div className={`${sharedStyles.layout} ${blogStyles.blogIndex}`}>
        <h1>My Notion Blog</h1>
        {posts.length === 0 && (
          <p className={blogStyles.noPosts}>There are no posts yet</p>
        )}
        {posts.map((post) => {
          console.log(post.Image) // ✅ Verifique se a URL da imagem aparece no console do navegador

          return (
            <Link
              href="/blog/[slug]"
              as={getBlogLink(post.Slug)}
              key={post.Slug}
            >
              <div className={blogStyles.postPreview}>
                {/* ✅ Exibe a imagem corretamente se a URL for válida */}
                {post.Image && (
                  <img
                    src={post.Image}
                    alt="Imagem do post"
                    style={{ maxWidth: '100%', height: 'auto' }}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                )}
                <h3>
                  <span className={blogStyles.titleContainer}>
                    {!post.Published && (
                      <span className={blogStyles.draftBadge}>Draft</span>
                    )}
                    <Link href="/blog/[slug]" as={getBlogLink(post.Slug)}>
                      <a>{post.Page}</a>
                    </Link>
                  </span>
                </h3>
                {post.Authors.length > 0 && (
                  <div className="authors">By: {post.Authors.join(' ')}</div>
                )}
                {post.Date && (
                  <div className="posted">
                    {' '}
                    Publicado em: {getDateStr(post.Date)}
                  </div>
                )}
                <p>
                  {(!post.preview || post.preview.length === 0) &&
                    'No preview available'}
                  {(post.preview || []).map((block, idx) =>
                    textBlock(block, true, `${post.Slug}${idx}`)
                  )}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

export default Index;