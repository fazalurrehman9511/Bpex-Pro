import { useEffect, useMemo, useRef } from 'react'

const TINYMCE_CDN = 'https://cdn.jsdelivr.net/npm/tinymce@8.8.2'

function resolveImageUrl(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

let tinymceLoader

function loadTinyMce() {
  if (typeof window !== 'undefined' && window.tinymce) {
    return Promise.resolve(window.tinymce)
  }
  if (tinymceLoader) return tinymceLoader

  tinymceLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tinymce-loader]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.tinymce))
      existing.addEventListener('error', () => reject(new Error('Failed to load TinyMCE')))
      return
    }

    const script = document.createElement('script')
    script.src = `${TINYMCE_CDN}/tinymce.min.js`
    script.dataset.tinymceLoader = 'true'
    script.referrerPolicy = 'origin'
    script.onload = () => {
      if (window.tinymce) resolve(window.tinymce)
      else reject(new Error('TinyMCE did not initialize'))
    }
    script.onerror = () => reject(new Error('Failed to load TinyMCE script'))
    document.head.appendChild(script)
  })

  return tinymceLoader
}

/**
 * TinyMCE rich text editor — script loaded from CDN (no heavy npm bundle).
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write content…',
  minHeight = 420,
  onImageUpload,
}) {
  const hostRef = useRef(null)
  const editorRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const onImageUploadRef = useRef(onImageUpload)
  onChangeRef.current = onChange
  onImageUploadRef.current = onImageUpload

  const initConfig = useMemo(
    () => ({
      license_key: 'gpl',
      base_url: TINYMCE_CDN,
      suffix: '.min',
      height: minHeight,
      menubar: 'file edit view insert format tools table help',
      plugins: [
        'advlist',
        'autolink',
        'lists',
        'link',
        'image',
        'charmap',
        'preview',
        'anchor',
        'searchreplace',
        'visualblocks',
        'code',
        'fullscreen',
        'insertdatetime',
        'media',
        'table',
        'help',
        'wordcount',
      ],
      toolbar:
        'undo redo | blocks fontsize | forecolor backcolor | bold italic underline strikethrough | ' +
        'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
        'link image media table | removeformat code fullscreen',
      block_formats:
        'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Preformatted=pre',
      fontsize_formats: '12px 14px 16px 18px 20px 24px 32px',
      font_family_formats:
        'System UI=system-ui,sans-serif; Arial=arial,helvetica,sans-serif; Georgia=georgia,serif; ' +
        'Times New Roman=times new roman,times,serif; Verdana=verdana,geneva,sans-serif; Courier=courier new,courier,monospace',
      content_style:
        'body { font-family: system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.6; color: #0f172a; }',
      placeholder,
      branding: false,
      promotion: false,
      statusbar: true,
      elementpath: true,
      resize: true,
      paste_data_images: true,
      automatic_uploads: Boolean(onImageUpload),
      images_upload_handler: onImageUpload
        ? (blobInfo) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = async () => {
                try {
                  const uploaded = await onImageUploadRef.current(reader.result)
                  resolve(resolveImageUrl(uploaded))
                } catch (err) {
                  reject(err.message || 'Image upload failed')
                }
              }
              reader.onerror = () => reject('Failed to read image file')
              reader.readAsDataURL(blobInfo.blob())
            })
        : undefined,
      file_picker_types: onImageUpload ? 'image' : undefined,
      table_toolbar:
        'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | ' +
        'tableinsertcolbefore tableinsertcolafter tabledeletecol',
      link_default_target: '_blank',
      link_assume_external_targets: true,
    }),
    [minHeight, onImageUpload, placeholder],
  )

  const initConfigRef = useRef(initConfig)
  initConfigRef.current = initConfig

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!host) return undefined

    const textarea = document.createElement('textarea')
    textarea.defaultValue = value || ''
    host.appendChild(textarea)

    loadTinyMce()
      .then((tinymce) => {
        if (cancelled) return

        tinymce.init({
          ...initConfigRef.current,
          target: textarea,
          setup: (editor) => {
            editorRef.current = editor
            editor.on('init', () => {
              if (value) editor.setContent(value)
            })
            editor.on('change input undo redo keyup', () => {
              onChangeRef.current?.(editor.getContent())
            })
          },
        })
      })
      .catch((err) => {
        host.innerHTML = `<p class="p-4 text-xs text-red-400">${err.message || 'Editor failed to load'}</p>`
      })

    return () => {
      cancelled = true
      const editor = editorRef.current
      editorRef.current = null
      if (editor && window.tinymce) {
        window.tinymce.remove(editor)
      }
      host.innerHTML = ''
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor?.initialized) return
    const current = editor.getContent()
    const next = value || ''
    if (current !== next) {
      editor.setContent(next)
    }
  }, [value])

  return (
    <div className="rich-text-editor blog-rich-editor overflow-hidden rounded border border-border bg-white">
      <div ref={hostRef} className="rich-text-editor-host min-h-[120px]" />
    </div>
  )
}
