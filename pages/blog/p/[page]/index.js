import Layout from 'components/Layout';
import Hero from 'components/Hero';
import Wrapper from 'components/Wrapper';
import Highlight from 'components/Highlight';
import {
  gqlStaticPaths,
  gqlStaticPropsWithSubscription,
  imageFields,
  seoMetaTagsFields,
} from 'lib/datocms';
import Link from 'next/link';
import { Image as DatoImage, StructuredText } from 'react-datocms';
import Masonry from 'react-masonry-css';
import FormattedDate from 'components/FormattedDate';
import { BLOG_POSTS_PER_PAGE } from 'lib/pages';
import Head from 'components/Head';
import { renderMetaTags } from 'react-datocms';
import Paginator from 'components/Paginator';
import { range } from 'range';
import { useRouter } from 'next/router';
import s from './style.module.css';
import { useQuerySubscription } from 'react-datocms';

export const getStaticPaths = gqlStaticPaths(
  `
    query {
      meta: _allBlogPostsMeta {
        count
      }
    }
  `,
  'page',
  ({ meta }) =>
    range(
      1,
      Math.min(5, Math.ceil(meta.count / parseFloat(BLOG_POSTS_PER_PAGE))),
    ),
);

export const getStaticProps = gqlStaticPropsWithSubscription(
  `
    query($first: IntType!, $skip: IntType!) {
      blog {
        seo: _seoMetaTags {
          ...seoMetaTagsFields
        }
      }

      posts: allBlogPosts(
        first: $first
        skip: $skip
        orderBy: [_firstPublishedAt_DESC, _createdAt_DESC]
      ) {
        slug
        title
        excerpt {
          value
        }
        coverImage {
          url(imgixParams: { w: 550 })
          responsiveImage(imgixParams: { w: 550 }) {
            ...imageFields
          }
        }
        _firstPublishedAt
        _createdAt
      }

      meta: _allBlogPostsMeta {
        count
      }

      latestChangelogEntry: changelogEntry(
        orderBy: [_firstPublishedAt_DESC, _createdAt_DESC]
      ) {
        title
        slug
        _firstPublishedAt
        _createdAt
        content {
          value
          blocks {
            ... on InternalVideoRecord {
              id
              _modelApiKey
              autoplay
              thumbTimeSeconds
              video {
                title
                width
                height
                video {
                  duration
                  streamingUrl
                  thumbnailUrl
                }
              }
            }
            ... on ImageRecord {
              id
              _modelApiKey
            }
          }
        }
        categories {
          name
          color {
            hex
          }
        }
      }
    }

    ${imageFields}
    ${seoMetaTagsFields}
  `,
  {
    requiredKeys: ['blog', 'posts'],
    paramsToVars: ({ page }) => ({
      first: BLOG_POSTS_PER_PAGE,
      skip: BLOG_POSTS_PER_PAGE * parseInt(page),
    }),
  },
);

export default function Blog({ preview, subscription }) {
  const router = useRouter();

  const {
    data: { posts, blog, meta, latestChangelogEntry },
  } = useQuerySubscription(subscription);

  return (
    <Layout preview={preview}>
      <Head>{renderMetaTags(blog.seo)}</Head>
      <Hero
        title={
          <>
            Welcome to the <Highlight>DatoCMS&nbsp;Blog</Highlight>
          </>
        }
        subtitle={<>News, tips and highlights from the team at DatoCMS</>}
      />
      <Wrapper>
        {latestChangelogEntry && (
          <div>
            <div className={s.changelogIntro}>
              Latest from our Product Updates changelog →
            </div>
            <Link href={`/product-updates`}>
              <a className={s.changelogEntry}>
                <div className={s.changelogEntryTitle}>
                  {latestChangelogEntry.title}
                </div>
                <div className={s.changelogEntryDate}>
                  <FormattedDate
                    date={
                      latestChangelogEntry._firstPublishedAt ||
                      latestChangelogEntry._createdAt
                    }
                  />
                </div>
              </a>
            </Link>
          </div>
        )}

        <Masonry
          breakpointCols={{
            default: 2,
            650: 1,
          }}
          className={s.grid}
          columnClassName={s.column}
        >
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <a className={s.post}>
                {post.coverImage && post.coverImage.responsiveImage && (
                  <DatoImage
                    className={s.image}
                    data={post.coverImage.responsiveImage}
                  />
                )}
                {post.coverImage && !post.coverImage.responsiveImage && (
                  <img className={s.image} src={post.coverImage.url} />
                )}
                <div className={s.postBody}>
                  <h6 className={s.title}>{post.title}</h6>
                  <div className={s.excerpt}>
                    <StructuredText data={post.excerpt} />
                  </div>
                  <div className={s.footer}>
                    <div className={s.date}>
                      Posted on{' '}
                      <FormattedDate
                        date={post._firstPublishedAt || post._createdAt}
                      />
                    </div>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </Masonry>

        <Paginator
          perPage={BLOG_POSTS_PER_PAGE}
          currentPage={router.query ? parseInt(router.query.page) : 0}
          totalEntries={meta.count}
          href={(index) => (index === 0 ? '/blog' : `/blog/p/${index}`)}
        />
      </Wrapper>
    </Layout>
  );
}
