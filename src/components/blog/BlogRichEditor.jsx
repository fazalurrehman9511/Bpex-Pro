import RichTextEditor from '../admin/RichTextEditor'
import { uploadBlogImage } from '../../utils/api'

async function uploadBlogImageFromDataUrl(dataUrl) {
  const { url } = await uploadBlogImage(dataUrl)
  return url
}

/** Blog post body editor — TinyMCE with server image upload. */
export default function BlogRichEditor({ value, onChange, placeholder }) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder || 'Write your blog post…'}
      minHeight={480}
      onImageUpload={uploadBlogImageFromDataUrl}
    />
  )
}
