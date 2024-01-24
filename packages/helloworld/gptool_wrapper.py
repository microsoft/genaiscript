import subprocess
from typing import Optional, List

class GPTOOL_CLI:
    """
    Python wrapper for the GPTools CLI.
    """

    def run(self, tool: str, spec: List[str], out: Optional[str] = None, out_trace: Optional[str] = None,
            out_annotations: Optional[str] = None, out_changelog: Optional[str] = None, json: bool = False,
            yaml: bool = False, dry_run: bool = False, fail_on_errors: bool = False, retry: Optional[int] = None,
            retry_delay: Optional[int] = None, max_delay: Optional[int] = None, label: Optional[str] = None,
            github_issues: bool = False, temperature: Optional[float] = None, model: Optional[str] = None,
            seed: Optional[int] = None, apply_edits: bool = False, no_cache: bool = False,
            csv_separator: Optional[str] = None) -> None:
        """
        Runs a GPTools against a GPSpec.

        :param tool: The tool to run.
        :param spec: The specification to use.
        :param out: Output file.
        :param out_trace: Output file for trace.
        :param out_annotations: Output file for annotations.
        :param out_changelog: Output file for changelogs.
        :param json: Emit full JSON response to output.
        :param yaml: Emit full YAML response to output.
        :param dry_run: Dry run, don't execute LLM and return expanded prompt.
        :param fail_on_errors: Fails on detected annotation error.
        :param retry: Number of retries.
        :param retry_delay: Minimum delay between retries.
        :param max_delay: Maximum delay between retries.
        :param label: Label for the run.
        :param github_issues: Create a GitHub issue for errors.
        :param temperature: Temperature for the run.
        :param model: Model for the run.
        :param seed: Seed for the run.
        :param apply_edits: Apply file edits.
        :param no_cache: Disable LLM result cache.
        :param csv_separator: CSV separator.
        """
        # Construct the command with the provided options
        command = ['gptools', 'run', tool] + spec
        if out:
            command += ['-o', out]
        if out_trace:
            command += ['-ot', out_trace]
        if out_annotations:
            command += ['-oa', out_annotations]
        if out_changelog:
            command += ['-ocl', out_changelog]
        if json:
            command.append('-j')
        if yaml:
            command.append('-y')
        if dry_run:
            command.append('-d')
        if fail_on_errors:
            command.append('-fe')
        if retry is not None:
            command += ['-r', str(retry)]
        if retry_delay is not None:
            command += ['-rd', str(retry_delay)]
        if max_delay is not None:
            command += ['-md', str(max_delay)]
        if label:
            command += ['-l', label]
        if github_issues:
            command.append('-ghi')
        if temperature is not None:
            command += ['-t', str(temperature)]
        if model:
            command += ['-m', model]
        if seed is not None:
            command += ['-se', str(seed)]
        if apply_edits:
            command.append('-ae')
        if no_cache:
            command.append('--no-cache')
        if csv_separator:
            command += ['--cs', csv_separator]

        # Execute the command
        subprocess.run(command)

    # Other methods for keys, tools, specs, convert, and help-all would be added here with similar structure
