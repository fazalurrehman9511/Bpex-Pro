function renderBlock(block, index) {
  switch (block.type) {
    case 'html':
      return (
        <div
          key={index}
          className="blog-html-content"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      )
    case 'h2':
      return (
        <h2 key={index} className="mt-8 mb-3 text-lg font-bold text-text sm:text-xl">
          {block.text}
        </h2>
      )
    case 'p':
      return (
        <p key={index} className="mb-4 text-sm leading-relaxed text-muted sm:text-base">
          {block.text}
        </p>
      )
    case 'ul':
      return (
        <ul key={index} className="mb-4 ml-4 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed text-muted list-disc sm:text-base">
              {item}
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={index} className="mb-4 ml-4 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed text-muted list-decimal sm:text-base">
              {item}
            </li>
          ))}
        </ol>
      )
    default:
      return null
  }
}

export default function BlogContent({ content }) {
  return (
    <div className="blog-content">
      {content.map((block, i) => renderBlock(block, i))}
    </div>
  )
}
