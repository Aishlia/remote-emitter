<a name="readme-top"></a>
<br />
<div align="center">
  <a href="[https://github.com/Aishlia/remote-emitter](https://github.com/Aishlia/remote-emitter)">
    <img src="public/logo512.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Remote Emitter</h3>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#changelog">Changelog</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project
[Main Link](https://www.jn.country)
[Alt Link](https://remote-emitter.pages.dev/)

![Screenshot 2024-02-07 at 6 47 25 PM](https://github.com/Aishlia/remote-emitter/assets/18436006/33802a54-cf24-4f86-abd7-a7d3975cda50)
</div>
<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites
This projet utilizes Firebase as the store for messages. The following is an example of a .env that would be required to run this project. The .env should be located in remote-emitter/.env
```
REACT_APP_API_KEY=1234ABCD
REACT_APP_AUTH_DOMAIN=PROJECTNAME.firebaseapp.com
REACT_APP_PROJECT_ID=PROJECTNAME
REACT_APP_STORAGE_BUCKET=PROJECTNAME.appspot.com
REACT_APP_MESSAGING_SENDER_ID=1234
REACT_APP_APP_ID=1:234
REACT_APP_MEASUREMENT_ID=G1234
```

### Installation

```
npm run build
npm start
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Changelog
Can't update README in it's entirety too often. \
**2023-02-11 Sun**\
**Major Changes**
- [Rewrote](https://github.com/Aishlia/remote-emitter/commit/2a42c762dd741290e4ed2d0b16048bbf891b7f84) connections logic to utilize Neo4j graph db. Users are now stored as nodes and their connects are vertices. 6th degree connection displays faster than Firestore implimentation's calculation of 3rd degree. 
- Removed directionality of connections (temp removal). For now, all mentions are treated as bi-directional.
- [Redesigned](https://github.com/Aishlia/remote-emitter/commit/ee36638d4b313aa92e526b7f33094c8e7b295ff0) graph data structure. Re-added connection directionality. Connection type is now stored in vertices. (@UniqueRobot65 ↔ @VibrantBee22 ← @ZealousWanderer97 → @QuirkyXenops7)

**Minor Changes**
- Updated frontend to properly display new information. When a user clicks on another user's profile, they see the chain of users that connects them (ie. @me - @friend - @friend2 - @friend3 - @target_user)
- [Removed](https://github.com/Aishlia/remote-emitter/commit/63dd92734a7cc982451d402745b926e3be372b7d) formatPath function
- [Readded](https://github.com/Aishlia/remote-emitter/commit/b516fa6906c7752721294ad6fc303fa6651d19b5) location data. Not sure when I accidentally removed it
- [Adjusted](https://github.com/Aishlia/remote-emitter/commit/9fe92e3dedb9a412b8234eb9e8999b39f87c228f) graph query to remove extra names. Connection chains start with the viewing user and end with the profile being viewed.
- [Add](https://github.com/Aishlia/remote-emitter/commit/b13361084841e0c67c163bfbfa2c473c9e3eb8a8) prevention of double submitting with submit state. New submitions not allowed when submit state is on. 

**2023-02-10 Sat**\
**Major Changes**
- Changed chain logic. Added semi-functioning directionality. @a mentioning @b should be counted as @a → @b. @b then mentioning @a back should be counted as @a ↔ @b

**Minor Changes**
- Minor CSS changes for mobile view

**2023-02-09 Fri**\
**Major Changes**
- [Added](https://github.com/Aishlia/remote-emitter/commit/5da19d881c538c33c33701f6aa5fa6c36331d902) new Firestore interests collection to store followed hashtags. Users who use a hastag are now following that hastag.
- [Added](https://github.com/Aishlia/remote-emitter/commit/1d9ac584f575e5f3a8937916d127c6c26ca437eb) global view and home view to HomePage. Global view shows all posts, home view shows only posts tagged with a hastag that the user is following.

**Minor Changes**
- Finally [ran](https://github.com/Aishlia/remote-emitter/commit/99dfbd879bea76cd0c9278337357030c0445579c) prettier
- [Wrote](https://github.com/Aishlia/remote-emitter/commit/c4c2d18d887dd8f58def86df1d9ac03a4b8370c4) README overview of how Firestore collections are used

**2023-02-08 Thu**\
**Major Changes**
- [Added](https://github.com/Aishlia/remote-emitter/commit/04caf6a9ab13729a50e52a5919c68ab31c9dfa1a) Heatmap POC
- [Created](https://github.com/Aishlia/remote-emitter/commit/be61e64c70d7642454c359ef70e05b7fb00ae4a6) POC for connection chain calculation using new Firestore collection "connections"

**Minor Changes**
- [Added](https://github.com/Aishlia/remote-emitter/commit/810d17d8227eca7c7a301a2f9aaa18a9eb672acb) links to global heatmap to HomePage
- [Removed](https://github.com/Aishlia/remote-emitter/commit/a52fbd1b3bbcc14ef09e9047d6080e598276b828) unused const assignment

**2023-02-07 Wed:**\
- Introduced session-based unique names
- Linked @mentions to user pages.
- **Added # tagging functionality with /tag/\<tag\>**
- Updated homepage logo for return navigation
- Shortened datetime and address displays\
/\ v0.0.0
- Made usernames non-editable; set Cloudflare environment variables
- Removed submit button from UserPage; removed send button from HomePage
- **Added mention array and hashtag array columns to database**
- Added posts and mentions buttons to profile
- **Introduced top 3 hashtags feature**
- Linked main username on HomePage to /\<username\>

<p align="right">(<a href="#readme-top">back to top</a>)</p>
