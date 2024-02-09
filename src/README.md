# Firebase Collections Documentation
## Collections Overview

### `connections`

- **Purpose**: Tracks social connections between users.
- **Usage**: Used in `UserPage.js` to calculate and display the connection path between the viewing user and the profile being viewed. This involves fetching all connections, processing them to find a continuous chain of connections between two users, and displaying this chain or indicating no chain found if applicable.
  - **Code Citation**: The function `processConnections` in `UserPage.js` fetches, processes, and displays user connections.

### `interests`

- **Purpose**: Stores user-specific interests based on hashtags in posted messages.
- **Usage**: 
  - In `HomePage.js`, user interests are fetched upon setting the username. These interests are then used to filter messages displayed in the "Home" view mode, showing only messages that contain hashtags matching the user's interests.
    - **Code Citation**: The `useEffect` hook related to the username dependency in `HomePage.js` fetches user interests.
  - When a user posts a message with hashtags, these hashtags are added to the user's `interests` document, ensuring that the user's interests are dynamically updated based on their activity.
    - **Code Citation**: The `addMessage` function in `HomePage.js` updates the user's interests with new hashtags from the posted message.

### `messages`

- **Purpose**: Contains all messages posted by users, including metadata such as timestamps, username, geolocation data, mentions, and hashtags.
- **Usage**: 
  - `HomePage.js` utilizes this collection extensively for displaying messages globally or filtered based on user interests. Users can post new messages, which are then added to this collection with relevant metadata.
    - **Code Citation**: The `useEffect` hook for `viewMode` and `userTags` in `HomePage.js` fetches and displays messages. The `handleSubmit` function posts new messages.
  - `UserPage.js` fetches messages either created by the user (posts) or mentioning the user (mentions), depending on the selected view mode.
    - **Code Citation**: The `useEffect` hook in `UserPage.js` that depends on `username` and `viewMode` for fetching user-specific posts or mentions.
  - `TagPage.js` displays messages tagged with a specific hashtag, demonstrating the use of hashtags for content categorization and discovery.
    - **Code Citation**: The `useEffect` hook in `TagPage.js` fetches messages containing a specific hashtag from the URL parameters.

## Implementation Details

### Posting Messages

When a user submits a message through the form in `HomePage.js`, the application:
1. Validates the message length and checks for duplicate submissions within the last minute.
2. Optionally captures the user's geolocation data.
3. Extracts mentions and hashtags from the message text.
4. Creates a new document in the `messages` collection with this data.
5. Updates the user's interests in the `interests` collection based on the hashtags in the message.

### Viewing Connections

`UserPage.js` processes the `connections` collection to display the connection path between the profile owner and the viewer. This feature enhances the social aspect of the application by visualizing user connections.

### Filtering by Interests

The app filters messages based on user interests (tags) in the "Home" view mode. This personalized content stream encourages user engagement by displaying relevant content.

### Dynamic Username Assignment

Upon first use, a random username is generated and stored in `localStorage`. This username is then used for message posting and user identification within the app.
