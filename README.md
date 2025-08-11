**What is Captallite**  
Captallite is a platform for private, paid crowdmapping with (WhatsApp) Chats and (Google) Photos.

**What is WhatsApp Maps**  
WhatsApp Maps are private community maps made with WhatsApp.

**What is Photos Maps**  
Photos Maps are private maps made with geotagged photos that are in the phone's (Google) Photos gallery.

**What are Captallite Business Mappers?**  
People who make a business creating maps with Captallite.

**Why Captallite**  
Decades of satellite imagery archives help us understand change from space. To better understand change from the ground, we need to unlock the photos from the past that are in our phones, and incentivise the collection of new ones by many people, especially those at the margins. For that, crowdsourcing needs to be embedded in people’s chats and photos (not mapping apps), and become more private (less open) and paid (not volunteered). <u>A peer-reviewed publication explaining this will be available here soon.</u>

**Captallite is a Progressive Web App** 👉 https://captallite.com

# Guidance for Developers

- [Captallite first prototypes](https://github.com/MarcosMoreu/Kapta-Prototyping/commit/a06af733f0179d17b44190a7791395d624034477)
  
## Requirements

- Node.js v20.0.0 or later
- npm v10.0.0 or later

## Installation

1. Clone the repository: `git clone https://github.com/UCL/kapta-lite.git && cd kapta-lite`
2. Run `npm install` in the root directory
3. Create config file (see below)
4. Run `npm run build` to build the project
5. Run `npm start` to start the development server
6. Open `http://localhost:8080` in your browser

## Configuration

Captallite requires a configuration file to be created in the src directory. The file should be named `config.json` and should contain the following fields:

```json
{
	"mapbox": {
		"accessToken": "YOUR_MAPBOX_ACCESS_TOKEN"
	},
	"api": {
		"invokeUrl": "" // API URL (optional)
	}
}
```

# People

Captallite is spinning out from University College London (UCL). Captallite is being developed by the UCL's Extreme Citizen Science Lab and the UCL's Advanced Research Computing Centre, with support from external partners and contributors. 

- [Marcos Moreu](https://www.linkedin.com/in/marcosmoreubadia)
- [Fabien Moustard](https://www.linkedin.com/in/fabien-moustard-996998227)
- [Tom Couch](https://www.ucl.ac.uk/advanced-research-computing/people/tom-couch)
- [Muki Haklay](https://www.ucl.ac.uk/geography/muki-haklay-facss)
- [Claire Ellul](https://www.ucl.ac.uk/civil-environmental-geomatic-engineering/people/dr-claire-ellul)
- [Jed Stevenson](https://www.durham.ac.uk/staff/jed-stevenson/)


# Legal disclaimer

Copyright 2024 University College London (UCL)

Licensed under the **Apache License, Version 2.0** (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
