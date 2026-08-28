import type { Book } from '@bbbook/shared-types'

const sampleBooks: Book[] = [
  { id: '1', title: 'Sample Book', author: 'Author' },
]

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>bbbook</h1>
      <p>Kindle 管理平台骨架已就绪。</p>
      <ul>
        {sampleBooks.map((book) => (
          <li key={book.id}>
            {book.title} - {book.author}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
