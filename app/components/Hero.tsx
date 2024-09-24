import Link from 'next/link'

export default function Hero() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Markdown Tree</h1>
          <p className="py-6">一个用于构建交互式Markdown树状图的强大工具</p>
          <Link href="/read" className="btn btn-primary">开始使用</Link>
        </div>
      </div>
    </div>
  )
}