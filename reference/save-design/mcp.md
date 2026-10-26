---
source: https://save.design/mcp
fetched: 2026-10-26
note: Server-rendered, unlike the homepage. Feature sections have "Video Demo" slots whose media was not captured.
---

# save.design - MCP feature page reference

## Structure
- The deepest of the three save.design feature pages: hero with client logos (Cursor, ChatGPT, Claude, v0, Figma) and a chat mock, five "it does X" sections (H2 as a claim + two short paragraphs + video demo), a tool reference listing all 19 MCP tools by name with one-line descriptions split into Read / Build groups, a 3-step setup with the literal server URL, a 12-logo compatible-clients strip, cross-sell block, 9-item FAQ, closing CTA.
- About 10 sections. The tool reference is the distinguishing move: a marketing page that doubles as API documentation (tool names in monospace, one sentence each, with explicit permission boundaries: "Anything you made is refused."). The FAQ is long-form and candid about limits ("Clips you upload yourself aren't re-watched yet").
- Copy-heavy; media is five video demos plus logos. No tabs or accordions; FAQ is a flat list. Pricing only via FAQ ("comes with Individual and Team").
- Hands off to Canvas ("See Canvas", "Ask for a moodboard. Get one.") and Extension via cross-sell.

## Title and meta
- Title: MCP for your design library — save.design
- Meta description: Connect your save.design workspace to Claude, Cursor, ChatGPT, or any MCP client. Your saved websites, sections, images, pages, and notes, searchable from inside the AI tool you already use, which can also build boards for you from Explore.
- OG description: Every save in your workspace is one MCP connection away from every AI tool you use.

## Hero
- Headline: Finally, plug your creative findings into your AI tools
- Subhead: Every save on the platform (websites, sections, images, pages) is one MCP connection away from every AI tool you use.
- CTAs: Start here, Connect in 2 minutes
- Logos: Cursor, ChatGPT, Claude, v0, Figma
- Mock: "Claude · save.design MCP" chat; sub-headline: Connect your creative knowledge base to the work.

## Section: Ask for it the way you'd say it.
- Describe what you're looking for and it finds it: "that minimal dark dashboard", "the type poster I uploaded", "the nav I built for Arc".
- It searches everything in your workspace: saved, uploaded, or built there.
- CTA: Get the endpoint. Video Demo

## Section: It sees the reference, not the filename.
- Websites, captured sections, uploaded images and PDFs come back as the actual image, delivered inline for the model to analyze. Saved videos come back as their preview frame.
- So when you ask for "sections with playful typography", it's matching what a model actually saw in each screenshot, not words you had to write about them.
- Video Demo

## Section: Your folders are the context.
- Ask for something by where it lives. Folders, workspaces and item types all come through, so "the save.design logo in my Platform Assets folder" is an instruction it can follow.
- You stop hunting through folders yourself, and you stop pasting assets into chat to explain which one you meant.
- Video Demo

## Section: Your docs and notes, straight into the build.
- Pages come back as markdown. Your own notes come back attached to whatever you wrote them on, and a saved website brings its tech-stack breakdown along too.
- Your agent picks up where you left off, working to the conventions you already set instead of inventing new ones.
- Video Demo

## Section: Ask for a moodboard. Get one.
- Describe the direction and it builds the board in your workspace: your own saves and finds from Explore, grouped under titled frames, with notes and labelled arrows saying what to take from each reference.
- It only changes what it added. Anything you placed on the board yourself stays exactly as you left it.
- CTA: See Canvas. Link: Watch the full episode. Video Demo

## Section: Reads your library. Builds your boards. (tool reference)
- Intro: Nine tools read what you saved and the boards you arranged it on. Ten more let your AI find references in Explore and lay them out on a board, changing only what it added. Nothing you made can be edited, and nothing deletes a saved item.
- Read: list_workspaces (every workspace you can reach, and which ones MCP is allowed to read); list_folders (folders inside those workspaces, for scoping to one project); list_items (everything you saved, newest first: websites, links, files, pages, sections, boards); get_item (light summary: title, source, folder, your note, type-specific metadata); read_item_content (the full thing on demand: markdown, file contents, or the image itself); search_items (natural-language search ranked across your own saves; no global library mixed in); canvas_list; canvas_get (a whole board as an outline: frames, cards, notes, arrows); canvas_get_node (one card up close)
- Build: explore_search_elements (search the curated Elements, parts of real websites, by describing the look); explore_search_sites (browse curated sites by category, industry, font, animation library or framework); explore_view (look at one Element or site before it goes on a board); canvas_create; canvas_add_items (Explore picks are saved to the board's folder); canvas_add_note; canvas_add_frame (group references under a titled frame: a direction, a theme, type, colour); canvas_connect (a labelled arrow saying what to take from a reference); canvas_update_nodes / canvas_remove_nodes (change or take off what it added; anything you made is refused)
- CTAs: Get the endpoint, How to connect

## Section: One URL. Any MCP client. (setup, 3 steps)
- Body: MCP is an open protocol, so this is not an integration we had to build tool by tool. If your app speaks MCP, it can read your library.
- 01 Copy the server URL: One endpoint for your whole account. It works for every workspace you can read.
- 02 Add it in your AI tool: Paste it as a custom connector or MCP server. Cursor and VS Code take a one-click link; Claude Code takes a single command.
- 03 Sign in with save.design: OAuth, in the tool you're already in. No API keys to generate, rotate, or leak, and you can revoke any connection from settings.
- Server URL: https://save.design/api/mcp. Exact instructions for each tool live in your account settings once you're signed in.
- Client strip: Claude, Cursor, Lovable, Bolt, v0, Figma Make, ChatGPT, Windsurf, Codex, VS Code, Replit, Base44

## Section: MCP is one part of Save Design. (cross-sell)
- Body: Save Design is the workspace behind the endpoint. Turn everything you collect and study into a living creative knowledge base.
- Everything you save, in one place. | Extension / Save from any page. (See the extension) | See how any site is built. | Canvas / Mood boards from what you saved. (See Canvas)

## Section: Answers (FAQ, 9)
- What is MCP, exactly?: The Model Context Protocol, an open standard for connecting an AI tool to a data source. You add one server URL to Claude, Cursor, ChatGPT, or any other MCP client, authorize it once, and the tool can call that server's tools mid-conversation. save.design runs one for your library.
- What can my AI actually see?: Everything in a workspace it's allowed to read: websites and their tech-stack analyses, captured sections, uploaded files, images and videos, written pages, the boards you arranged them on, and the notes and folders. Visual items come back as the real image. A shared workspace is shared here too.
- What if I never named or tagged the file?: It still turns up. Images are analyzed the moment you upload them (a model writes the title, description, and search attributes covering technique, mood, colour and typography) and a PDF's contents are read into its index. So Untitled-3.png doesn't stay Untitled-3.png. Its folder counts too: anything in "Client — Arc" answers to "Arc".
- What about saved videos and screen recordings?: Recordings come back as their preview frame. Animated sections from the library were analyzed as video when added, so they're searchable by motion. Clips you upload yourself aren't re-watched yet; those answer to their title, your note, and their folder.
- Can it change or delete my saves?: No. It can create boards, save Elements and sites into a board's folder, and change or remove what it added itself (those nodes carry a Claude badge). Anything you made, it can only read, and nothing in the API deletes a saved item.
- Does it search the whole save.design curated websites and elements library?: Searching your saves stays yours. Separate Explore tools let your AI search and look at the curated Elements and sites when it builds a board for you.
- Which plan includes it?: The personal MCP endpoint comes with Individual and Team membership. Access is granted per workspace.
- How does signing in work?: Standard OAuth. Your tool sends you to save.design, you approve the connection, and it gets a token.
- Can I disconnect a tool later?: Yes. Account settings → Integrations lists every connected app with a revoke button. Revoking kills that tool's access immediately; the others keep working.

## Closing CTA
- Heading: Your library, inside every tool you build in.
- Body: Connect it once. Stop describing what you already saved.
- CTA: Get the endpoint

## Social proof
- Logos: 5 in hero, 12 in client strip
- Quotes: none
- Stats: 19 tools (9 read, 10 build)
