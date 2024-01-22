import subprocess
import shlex


class GPToolsCLI:
    """
    Python wrapper for the GPTools command line interface.
    """

    def __init__(self):
        pass

    def run(self, tool, spec, out=None, out_trace=None, out_annotations=None,
            out_changelog=None, json=False, yaml=False, dry_run=False,
            fail_on_errors=False, retry=8, retry_delay=15000, max_delay=180000,
            label=None, github_issues=False, temperature=None, model=None,
            seed=None, apply_edits=False, no_cache=False, csv_separator="\t"):
        """
        Runs a GPTools against a GPSpec.

        :param tool: The tool to run.
        :param spec: The spec to run against.
        :param out: Output file. Extra markdown fields for output and trace will also be generated.
        :param out_trace: Output file for trace.
        :param out_annotations: Output file for annotations (.csv will be rendered as csv).
        :param out_changelog: Output file for changelogs.
        :param json: Emit full JSON response to output.
        :param yaml: Emit full YAML response to output.
        :param dry_run: Dry run, don't execute LLM and return expanded prompt.
        :param fail_on_errors: Fails on detected annotation error.
        :param retry: Number of retries.
        :param retry_delay: Minimum delay between retries.
        :param max_delay: Maximum delay between retries.
        :param label: Label for the run.
        :param github_issues: Create a GitHub issues for errors.
        :param temperature: Temperature for the run.
        :param model: Model for the run.
        :param seed: Seed for the run.
        :param apply_edits: Apply file edits.
        :param no_cache: Disable LLM result cache.
        :param csv_separator: CSV separator.
        """
        cmd = f"gptools run {tool} {spec}"
        cmd += f" -o {out}" if out else ""
        cmd += f" -ot {out_trace}" if out_trace else ""
        cmd += f" -oa {out_annotations}" if out_annotations else ""
        cmd += f" -ocl {out_changelog}" if out_changelog else ""
        cmd += " -j" if json else ""
        cmd += " -y" if yaml else ""
        cmd += " -d" if dry_run else ""
        cmd += " -fe" if fail_on_errors else ""
        cmd += f" -r {retry}" if retry != 8 else ""
        cmd += f" -rd {retry_delay}" if retry_delay != 15000 else ""
        cmd += f" -md {max_delay}" if max_delay != 180000 else ""
        cmd += f" -l {label}" if label else ""
        cmd += " -ghi" if github_issues else ""
        cmd += f" -t {temperature}" if temperature else ""
        cmd += f" -m {model}" if model else ""
        cmd += f" -se {seed}" if seed else ""
        cmd += " -ae" if apply_edits else ""
        cmd += " --no-cache" if no_cache else ""
        cmd += f" --cs {csv_separator}" if csv_separator != "\t" else ""
        return subprocess.run(shlex.split(cmd), check=True)

    def keys(self, command=None):
        """
        Manage OpenAI keys.

        :param command: The keys command to execute (show, help).
        """
        cmd = "gptools keys"
        cmd += f" {command}" if command else ""
        return subprocess.run(shlex.split(cmd), check=True)

    def tools(self, command=None):
        """
        Manage GPTools.

        :param command: The tools command to execute (list, help).
        """
        cmd = "gptools tools"
        cmd += f" {command}" if command else ""
        return subprocess.run(shlex.split(cmd), check=True)

    def specs(self, command=None):
        """
        Manage GPSpecs.

        :param command: The specs command to execute (list, help).
        """
        cmd = "gptools specs"
        cmd += f" {command}" if command else ""
        return subprocess.run(shlex.split(cmd), check=True)

    def convert(self, path, out=None):
        """
        Convert HTML files or URLs to markdown format.

        :param path: Path to the HTML file or URL to convert.
        :param out: Output directory.
        """
        cmd = f"gptools convert {path}"
        cmd += f" -o {out}" if out else ""
        return subprocess.run(shlex.split(cmd), check=True)

    def help_all(self):
        """
        Show help for all commands.
        """
        cmd = "gptools help-all"
        return subprocess.run(shlex.split(cmd), check=True)
