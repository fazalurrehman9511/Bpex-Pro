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
        <h2
          key={index}
          className="mb-4 mt-12 scroll-mt-24 border-l-2 border-emerald-600 pl-4 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-[1.75rem]"
        >
          {block.text}
        </h2>
      )
    case 'p':
      return (
        <p key={index} className="mb-6 text-[15px] leading-7 text-slate-700 sm:text-[17px] sm:leading-8">
          {block.text}
        </p>
      )
    case 'ul':
      return (
        <ul key={index} className="mb-7 ml-5 space-y-3 marker:text-emerald-600">
          {block.items.map((item, i) => (
            <li key={i} className="list-disc pl-1 text-[15px] leading-7 text-slate-700 sm:text-[17px]">
              {item}
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={index} className="mb-7 ml-5 space-y-3 marker:font-bold marker:text-emerald-700">
          {block.items.map((item, i) => (
            <li key={i} className="list-decimal pl-1 text-[15px] leading-7 text-slate-700 sm:text-[17px]">
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
      {(Array.isArray(content) ? content : []).map((block, i) => renderBlock(block, i))}
    </div>
  )
}
