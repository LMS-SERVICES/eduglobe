'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Option = { option: string }
type Question = { question: string; questionImageUrl: string; marks: number; negativeMarks: number; correctOptionIndex: number; options: Option[] }
type Section = { title: string; questions: Question[] }

const newQuestion = (): Question => ({
  question: '',
  questionImageUrl: '',
  marks: 1,
  negativeMarks: 0,
  correctOptionIndex: 0,
  options: [{ option: '' }, { option: '' }, { option: '' }, { option: '' }],
})

export default function CreateMockTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    thumbnail: '',
    durationMinutes: 150,
    isFree: true,
    price: 0,
    isPublished: false,
  })
  const [sections, setSections] = useState<Section[]>([{ title: 'Section 1', questions: [newQuestion()] }])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/mock-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sections }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push('/admin/mock-tests')
    } catch (e: any) {
      setError(e.message || 'Failed to create mock test')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Create Mock Test</h1>
        <Link href="/admin/mock-tests" className="px-4 py-2 rounded-lg border border-dark-600 text-gray-200 hover:bg-dark-800">Back</Link>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <form onSubmit={create} className="space-y-6">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-4">
          <input className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <textarea className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          <div className="grid md:grid-cols-4 gap-3">
            <input className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value || 0) })} placeholder="Duration (min)" />
            <input className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" type="number" value={form.price} disabled={form.isFree} onChange={(e) => setForm({ ...form, price: Number(e.target.value || 0) })} placeholder="Price" />
            <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked, price: e.target.checked ? 0 : form.price })} /> Free Mock</label>
            <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publish</label>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section, si) => (
            <div key={si} className="bg-dark-800 border border-dark-700 rounded-xl p-5 space-y-4">
              <input className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" value={section.title} onChange={(e) => {
                const u = [...sections]
                u[si].title = e.target.value
                setSections(u)
              }} placeholder={`Section ${si + 1}`} />
              {section.questions.map((q, qi) => (
                <div key={qi} className="border border-dark-700 rounded-lg p-4 space-y-3">
                  <textarea className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" value={q.question} onChange={(e) => {
                    const u = [...sections]
                    u[si].questions[qi].question = e.target.value
                    setSections(u)
                  }} placeholder={`Question ${qi + 1}`} />
                  <div className="grid md:grid-cols-3 gap-3">
                    <input className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" type="number" value={q.marks} onChange={(e) => { const u = [...sections]; u[si].questions[qi].marks = Number(e.target.value || 0); setSections(u) }} placeholder="Marks" />
                    <input className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" type="number" value={q.negativeMarks} onChange={(e) => { const u = [...sections]; u[si].questions[qi].negativeMarks = Number(e.target.value || 0); setSections(u) }} placeholder="Negative marks" />
                    <select className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" value={q.correctOptionIndex} onChange={(e) => { const u = [...sections]; u[si].questions[qi].correctOptionIndex = Number(e.target.value); setSections(u) }}>
                      {q.options.map((_, oi) => <option key={oi} value={oi}>Correct: Option {oi + 1}</option>)}
                    </select>
                  </div>
                  {q.options.map((opt, oi) => (
                    <input key={oi} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" value={opt.option} onChange={(e) => {
                      const u = [...sections]
                      u[si].questions[qi].options[oi].option = e.target.value
                      setSections(u)
                    }} placeholder={`Option ${oi + 1}`} />
                  ))}
                </div>
              ))}
              <button type="button" onClick={() => {
                const u = [...sections]
                u[si].questions.push(newQuestion())
                setSections(u)
              }} className="px-3 py-2 rounded border border-dark-600 text-gray-200 hover:bg-dark-700">Add Question</button>
            </div>
          ))}
          <button type="button" onClick={() => setSections([...sections, { title: `Section ${sections.length + 1}`, questions: [newQuestion()] }])} className="px-3 py-2 rounded border border-dark-600 text-gray-200 hover:bg-dark-700">Add Section</button>
        </div>

        <button type="submit" disabled={loading} className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Mock Test'}
        </button>
      </form>
    </div>
  )
}
