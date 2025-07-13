script({ system: ["system.annotations"], responseType: "text" });
def("FILE", env.files, { ignoreEmpty: true });

$`Review FILE and report errors and warnings using annotation format. Suggest fixes.`;
