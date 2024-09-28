export default function Features() {
  const features = [
    {
      title: "插件驱动",
      description: "通过插件扩展功能,轻松定制您的Markdown树",
    },
    { title: "协作编辑", description: "支持多人实时协作编辑Markdown文档" },
    { title: "无头设计", description: "灵活的UI,可以轻松集成到任何应用中" },
    { title: "可靠性高", description: "基于成熟的技术栈,稳定可靠" },
  ];

  return (
    <section className="py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">主要特性</h2>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex ${
                index % 2 === 0 ? "flex-row" : "flex-row-reverse"
              } items-center py-8`}
            >
              <div className="w-1/2">
                <div className="card bg-base-400 shadow-xl h-80 mx-1">
                  {" "}
                  {/* 调整卡片高度 */}
                  <div className="card-body">
                    <h3 className="card-title">{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              </div>
              <div className="w-1/2 h-80 bg-gray-200 flex items-center justify-center mx-1">
                {" "}
                {/* 图片占位 */}
                {/* 这里可以放置图片 */}
                <span>图片</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
