# DNA Shooter user guide

DNA Shooter is a browser creation game. Fill 20 segments of a DNA chain with complementary base pairs and watch a fictional creature develop. The current prototype runs entirely in your browser; you do not need an account.

## Start playing locally

The package declares Node.js 18.19 or newer as its minimum and requires npm; use a maintained Node release for a new setup. On another computer, replace the path below with your clone's actual path. In a terminal, run:

```sh
cd /home/snowdork/dev/DNA-Shooter
npm ci
npm run dev
```

Run `npm ci` for the first setup, and again after a dependency or lockfile update. For later sessions, return to the project folder and run `npm run dev`.

Keep the terminal open and visit **http://127.0.0.1:5173/**. If that port is already in use, Vite may choose another port; use the **Local** URL printed in the terminal. Click **Start creating** to begin.

This local address works only on the device running the command. The development server listens on `127.0.0.1`, so another computer or phone cannot use that address to reach it. For the VPS website, use the public HTTPS address supplied by the administrator; this project does not define a public hostname.

To stop the local server, press **Ctrl+C** in its terminal. Export your creation before stopping or closing the game if you want to keep it.

## Place a pair

Each successful placement takes four separate actions:

1. **Choose the first base.** Click one of the **A**, **T**, **C**, or **G** buttons beneath the game field.
2. **Choose its complement.** Choose **T** after **A**, **A** after **T**, **G** after **C**, or **C** after **G**. The status message confirms that the pair is ready.
3. **Lock an empty rung.** Click one of the four empty rungs in the moving chain. The rung highlights and the selected cannons turn toward it. Locking alone does not fire.
4. **Fire.** Click the locked rung again. The shot waits for the cannons to align, then launches automatically. Wait for the pair to land before choosing the next pair.

A noncomplementary second choice displays a hint and keeps your first choice. Choosing that first base again clears it. After selecting both bases, choosing another base begins a new pair and clears the target lock. Clicking a different empty rung changes the target; filled rungs cannot be targeted.

Fill all four rungs to finish a segment. The game adds an adaptation and briefly shows the completed segment before starting the next one. Watch **Next move** for pairing, aiming, and progress messages.

## Keyboard controls

Click **Start creating**, or click the game field, to focus the game before using shortcuts.

| Key | Action |
| --- | --- |
| **A**, **T**, **C**, **G** | Choose a base; press its complement separately to prepare a pair. |
| **1**, **2**, **3**, **4** | Lock the corresponding rung, counting from left to right. Pressing the same target number again also queues the shot. |
| **Enter** | Queue a shot at the locked rung. A pair and a target must already be selected. |
| **Escape** | Cancel the target lock and any queued shot; keep the selected bases. |
| **Space** | Pause or resume. |

For example, press **A**, **T**, **1**, then **Enter** to select `AT`, lock the leftmost rung, and fire.

Shortcuts are ignored while an input has focus, and **Enter** or **Space** activates a focused button using normal browser behavior. Click the game field if a shortcut is acting on a button instead. Holding a key does not repeat game actions. Base selection and targeting are unavailable while paused or during a segment transition.

## Score, patterns, and completion

Each landed pair earns **100 points**. Each completed four-pair segment earns a further **400 points**, for **800 points per segment**. A complete creation has **20 segments**, **80 placements**, **20 adaptations**, and **16,000 points**.

Pair orientation matters: choosing A then T produces `AT`, while T then A produces `TA`. The first selected base appears in the upper part of the filled rung and the second in the lower part. The same distinction applies to `CG` and `GC`.

A segment's four-pair pattern is read in rung order, **left to right**, regardless of the order in which you filled the rungs. These patterns determine adaptation labels and influence the creature's appearance. Expand **Your adaptations** below the controls to see each completed segment's label and pattern. Repeating the same saved creation restores the same patterns and creature appearance.

When all 20 segments are complete, the game stops accepting placements. Export the finished creation or choose **Restart** to begin again.

## Pause, restart, and reduced motion

Click **Pause** or press **Space** to pause. Use **Resume creating** or **Space** to continue. Switching to another browser tab or hiding the page also pauses the game; returning does not automatically resume it.

Pausing clears a queued shot, so it will not launch unexpectedly on resume. If you had queued a shot that had not launched, fire again after resuming. A shot already in flight freezes while paused and continues on resume.

**Restart** immediately replaces the current creation and starts a fresh game. It does not ask for confirmation. There is **no autosave**: restarting, refreshing, or closing the page discards progress that you have not exported. Loading a creation also replaces the current progress.

Enable **Reduced motion** to remove the chain's vertical wiggle and several decorative animations, and make cannon aiming immediate. The chain still travels slowly to the right and shots still animate. The setting initially follows the browser's system motion preference; you can change it with the checkbox.

## Export and load a creation

Click **Export creation** to download `dna-creation.json`. You can export a partial or finished creation, including while paused. Wait for any active shot to land before exporting if you want that placement included.

The export contains format version **1**, the creation seed, and the ordered history of landed placements. Score, completed segments, adaptations, and creature appearance are rebuilt from that history when loaded. The file does not preserve a selected pair, target lock, queued or flying shot, animation position, or reduced-motion setting.

To continue a saved creation:

1. Click **Load creation** and select a previously exported JSON file.
2. Look for **Creation restored. Resume when ready.**
3. Click **Resume creating** to continue. An empty creation may show **Start creating** instead; a completed creation remains complete.

Loading restores the game **paused**. Imports must be valid version 1 DNA Shooter exports and no larger than **32,768 bytes (32 KiB)**. Avoid editing the file manually: invalid pairings, repeated slots, or inconsistent segment history are rejected. A failed load leaves your current creation in place and displays an error message.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| The local page will not open. | Keep `npm run dev` running in the project folder and use its printed Local URL. Check for startup errors in the terminal. |
| `node` or `npm` is not found, or setup fails. | Install Node.js and npm, check `node --version`, then run `npm ci` from the project folder. |
| Another device cannot open `127.0.0.1:5173`. | That address belongs to the device opening the browser. Use the administrator's hosted website address for play on other devices. |
| The base buttons are disabled or the chain is still. | Click **Start creating** or **Resume creating**. The game also pauses when the tab is hidden. A completed creation requires **Restart** to play again. |
| A shot will not fire. | Choose a valid pair, lock an empty rung, and fire as a separate action. Wait for alignment and for any previous shot or segment transition to finish. If you paused before launch, fire again after resuming. |
| Keyboard controls act on a button or do nothing. | Click the game field to focus it, ensure the game is running, and press keys individually without Ctrl, Alt, or Command. |
| The page layout or game field is cramped. | Maximize the browser or reduce browser zoom so the field and controls fit. The game scales with the available width. |
| A creation will not load. | Select an unmodified DNA Shooter version 1 export within the 32 KiB limit. A JSON file from another program is not a creation export. |
| Progress disappeared after a refresh. | Load your most recent export. The prototype does not automatically save progress in the browser or on the VPS. |

## Biology note

A pairs with T, and C pairs with G in DNA. DNA Shooter's creature shapes, named adaptations, and pattern-to-trait rules are **fictional game mechanics**. The current prototype is a creation toy, not a scientific genetics or evolution simulation.
