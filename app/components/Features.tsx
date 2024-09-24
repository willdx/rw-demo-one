export default function Features() {
  const features = [
    { title: '插件驱动', description: '通过插件扩展功能,轻松定制您的Markdown树' },
    { title: '协作编辑', description: '支持多人实时协作编辑Markdown文档' },
    { title: '无头设计', description: '灵活的UI,可以轻松集成到任何应用中' },
    { title: '可靠性高', description: '基于成熟的技术栈,稳定可靠' },
  ]

  return (
    <section className="py-20 bg-base-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">主要特性</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}