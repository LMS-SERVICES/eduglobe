'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-dark-900 border border-dark-600 rounded-lg animate-pulse" />,
})

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeightClassName?: string
}

export default function RichTextEditor({ value, onChange, placeholder, minHeightClassName = 'min-h-[150px]' }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'clean'],
    ],
  }

  if (!mounted) {
    return <div className="h-[200px] bg-dark-900 border border-dark-600 rounded-lg animate-pulse" />
  }

  return (
    <div className="bg-dark-900 rounded-lg overflow-hidden border border-dark-600 focus-within:ring-2 focus-within:ring-primary/60 focus-within:border-primary/60 transition-all">
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid #334155;
          background: #0f172a;
          color: #fff;
        }
        .ql-container.ql-snow {
          border: none;
          background: #020617;
          color: #fff;
          font-size: 0.95rem;
        }
        .ql-editor {
          ${minHeightClassName === 'min-h-[220px]' ? 'min-height: 220px;' : 'min-height: 150px;'}
        }
        .ql-editor.ql-blank::before {
          color: #64748b;
          font-style: normal;
        }
        .ql-snow .ql-stroke {
          stroke: #94a3b8;
        }
        .ql-snow .ql-fill {
          fill: #94a3b8;
        }
        .ql-snow .ql-picker {
          color: #94a3b8;
        }
        .ql-snow .ql-picker-options {
          background: #0f172a;
          border-color: #334155;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="text-white"
      />
    </div>
  )
}
