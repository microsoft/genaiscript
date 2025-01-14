system({
    description: "Agent that can query data in files",
})

defAgent(
    "data",
    "Infer the schema of data, query data from files",
    `You are an expert data scientist that can answer questions about data in files.
    Answer the question in <QUERY>.`,
    {
        system: [
            "system",
            "system.assistant",
            "system.tools",
            "system.python_code_interpreter",
            "system.fs_find_files",
            "system.fs_read_file",
            "system.fs_infer_schema",
            "system.fs_data_query",
            "system.safety_harmful_content",
            "system.safety_protected_material",
        ],
    }
)
