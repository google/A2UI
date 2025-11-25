# Comparison of Contact and Restaurant Folders

I have analyzed the `contact` and `restaurant` folders and found that they are nearly identical in structure and logic, with some hardcoded differences primarily for branding and demo purposes.

## Key Differences

### 1. Main Application Files (`contact.ts` vs `restaurant.ts`)

| Feature | Contact | Restaurant |
| :--- | :--- | :--- |
| **Custom Element** | `a2ui-contact` | `a2ui-restaurant` |
| **Class Name** | `A2UIContactFinder` | `A2UILayoutEditor` |
| **Title** | "Contact Finder" | "Restaurant Finder" |
| **Default Input** | "Casey Smith" | "Top 5 Chinese restaurants in New York." |

### 2. HTML Entry Points (`index.html`)

| Feature | Contact | Restaurant |
| :--- | :--- | :--- |
| **Title** | "Contact Finder Agent" | "Restaurant Booking Agent" |
| **Body Tag** | `<a2ui-contact>` | `<a2ui-restaurant>` |
| **Script Tag** | `./contact.ts` | `./restaurant.ts` |
| **CSS Background** | `var(--background-light)` | `var(--background)` (Potential bug, should probably be `--background-light`) |

### 3. Shared Code
- **`client.ts`**: Identical in both folders.
- **Core Logic**: Both use the same `A2UIClient` and process messages identically.

## Conclusion
The two folders represent two separate demo applications built on the same underlying protocol. They diverge only in branding and default content. If you wish to have only one client app, these could be consolidated into a single, configurable app.
