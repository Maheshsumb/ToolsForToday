# Contributing to ToolsForToday

Thank you for helping make everyday browser tools more useful, accessible, reliable, and privacy-conscious.

ToolsForToday source code is distributed under the [Apache License 2.0](LICENSE). Contributions submitted for inclusion are accepted under that license as described in its terms. The license does not grant rights to the ToolsForToday name, logo, or other brand assets; third-party components keep their own licenses and notices.

## Ways to help

- Suggest a genuinely useful new tool.
- Fix a confirmed bug or improve an existing tool.
- Improve mobile usability, accessibility, performance, or browser compatibility.
- Add or improve automated tests.
- Correct documentation or explain a confusing workflow.
- Review security responsibly.

## Potential first contributions

These are areas to explore, not claims of confirmed defects or pre-approved issues:

- Add repeatable keyboard and screen-reader checks for the tool workflows.
- Document a browser/device compatibility test matrix for image and PDF processing.
- Add focused component-level interaction tests alongside the existing calculation and file-processing tests.
- Review tool instructions and error messages for clarity with representative users.
- Profile large-image and multi-page-PDF operations on mid-range mobile devices.
- Expand localization readiness for text measurement and date formatting.
- Improve accessibility guidance and examples for future tool proposals.

## Propose a new tool

Open a [new tool proposal](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=new_tool_proposal.yml) and describe:

1. The real user problem and who benefits.
2. Why it belongs in ToolsForToday and how it differs from existing tools.
3. Inputs, outputs, browser support, and expected limitations.
4. Whether it can run entirely in the browser and what dependencies it needs.
5. Privacy, accessibility, file-size, and resource considerations.
6. A practical testing plan.

Prefer small tools with clear everyday value. Proposals based only on keyword stuffing or artificial search traffic are out of scope. A browser feature must not need a secret key embedded in client code or send sensitive user content to an external service without a separately reviewed product and privacy change.

## Workflow after the license gate is cleared

1. Search existing Issues and pull requests for related work.
2. Open an issue for a bug, feature, or new tool proposal when discussion will help.
3. Discuss the scope before starting a large change.
4. Fork the repository and create a focused feature branch. Outside contributors do not push directly to `main`.
5. Implement the change and add or update tests and documentation.
6. Run lint, typecheck, the relevant test suites, and the production build.
7. Open a pull request with a clear description and test results.
8. Respond to maintainer review feedback. A pull request is not accepted until it has been reviewed and merged by the maintainer.

## Pull-request expectations

- Explain the purpose and keep the change focused.
- Include tests for behavior changes and documentation for new tools.
- Consider keyboard access, focus visibility, mobile layouts, and assistive technology.
- Confirm user-entered text, filenames, and file contents do not leak into analytics or unexpected network calls.
- Do not include secrets, hidden dependencies, generated build output, unrelated formatting, or unreviewed external requests.
- State the exact validation commands run and any checks not performed.

## Reporting bugs

Use the [bug report form](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=bug_report.yml). Include reproducible steps, expected and actual results, browser/device details, and screenshots only when they contain no private information.

## Suggesting improvements

Use the [feature request form](https://github.com/Maheshsumb/ToolsForToday/issues/new?template=feature_request.yml). Explain who benefits and why the change fits the project. Avoid requests whose only purpose is search ranking or keyword targeting.
