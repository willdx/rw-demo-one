import Image from "next/image";
import { motion } from "framer-motion";

const features = [
  {
    title: "清晰的结构",
    description: "通过一张思维导图管理你所有的知识卡片，理论上支持无限嵌套。",
    image: "https://i.imgur.com/LBBx9DV.png",
  },
  {
    title: "简洁的内容",
    description: "专注于写作本身，提供流畅的 Markdown 编辑体验",
    image: "https://i.imgur.com/VaXwaiT.png",
  },
  {
    title: "项目驱动+卡片复用",
    description: "远离分类整理文档的痛苦，帮助你构建可持续的卡片盒系统",
    image: "https://i.imgur.com/UyiHpXe.png",
  },
  {
    title: "AI协助构建个人知识库",
    description: "知识图谱构建工具，让你轻松构建自己的知识库，并实现智能问答",
    image: "https://i.imgur.com/ramWh67.png",
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          主要特性
        </motion.h2>
        <div className="space-y-24">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div
                className={`flex ${
                  index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                } items-center gap-8`}
              >
                <motion.div 
                  className="flex-1 space-y-4"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-lg text-gray-600">{feature.description}</p>
                </motion.div>
                <motion.div 
                  className="flex-1"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="relative aspect-[3/2] w-full">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-contain rounded-lg"
                      loading="lazy"
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
