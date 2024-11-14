FROM --platform=$TARGETPLATFORM neo4j:5.15.0

# 安装 APOC 插件
ENV NEO4J_PLUGINS=["apoc"]

# 配置 APOC
ENV NEO4J_apoc_export_file_enabled=true \
    NEO4J_apoc_import_file_enabled=true \
    NEO4J_apoc_import_file_use__neo4j__config=true

# 暴露端口
EXPOSE 7474 7687 