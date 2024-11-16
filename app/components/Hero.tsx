import Link from "next/link";

export default function Hero() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center mt-[-12rem]">
        <div className="max-w-xl">
          <h1 className="text-6xl font-bold mb-10">高效的阅读和写作</h1>
          <h2 className="text-5xl mb-10">清晰的结构 + 简洁的内容</h2>
          <Link href="/share" className="btn btn-primary">
            开始使用
          </Link>
        </div>
      </div>
    </div>
  );
}
