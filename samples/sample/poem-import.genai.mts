import { script, $, def } from "@genaiscript/runtime";

script({
  title: "poem with fake imports"
})

def("FILE", env.files)
$`Write a short poem`