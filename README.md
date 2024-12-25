# Face Tracking App

A face tracking web application built using **Next.js** with **TypeScript** and **TailwindCSS**. This app integrates **face-api.js** for real-time face detection and landmarks rendering, combined with video recording functionality. The recorded video includes both the face detection overlay and the original video feed.

## Demo

[Watch Demo](https://vimeo.com/1042158156?share=copy)

## Features

- **Face Detection**: Real-time face detection and landmarks rendering using `face-api.js`.
- **Recording**: Record video with face detection overlay.
- **Preview & Download**: Preview the recorded video and download it locally.
- **Responsive Design**: Fully responsive UI built with TailwindCSS.

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open the app in your browser at [http://localhost:3000](http://localhost:3000).

### Face API Models

Download the required models for face detection and place them in the `/public/weights` directory. The following models are needed:

- `tiny_face_detector_model-weights_manifest.json`
- `face_landmark_68_model-weights_manifest.json`
- `face_expression_model-weights_manifest.json`

You can download the models from the official [face-api.js GitHub repository](https://github.com/justadudewhohacks/face-api.js).

## Usage

1. Ensure your camera permissions are granted in the browser.
2. Start the app and allow the camera to initialize.
3. Click **Start Recording** to begin recording the video feed along with the face detection overlay.
4. Click **Stop Recording** to stop recording.
5. Preview the recorded video in the app.
6. Download the recorded video using the **Download Recording** button.

## Project Structure

```plaintext
.
├── public
│   ├── weights
│   │   ├── tiny_face_detector_model-weights_manifest.json
│   │   ├── face_landmark_68_model-weights_manifest.json
│   │   ├── face_expression_model-weights_manifest.json
├── src
│   ├── components
│   │   ├── ui
│   │   │   ├── button.tsx  # Reusable Button component
│   │   │   ├── card.tsx    # Reusable Card component
│   ├── lib
│   │   ├── utils.ts        # Utility functions
│   ├── pages
│   │   ├── index.tsx       # Main entry point
│   ├── styles
│   │   ├── globals.css     # TailwindCSS global styles
├── README.md
```

## What I Did

1. **Set Up Next.js Project**: Initialized the project with a Next.js template using TypeScript and TailwindCSS.
2. **Face Detection**: Integrated `face-api.js` for detecting faces and rendering landmarks.
3. **Video Recording**: Implemented video recording functionality, combining the video feed and overlay using the canvas API.
4. **Preview & Download**: Added features to preview the recorded video and download it locally.
5. **Responsive UI**: Designed the user interface to be clean and responsive using TailwindCSS.

## Technologies Used

- **Next.js**: Framework for React-based web applications.
- **TypeScript**: For type-safe development.
- **TailwindCSS**: Utility-first CSS framework for styling.
- **face-api.js**: For face detection and landmark rendering.
- **Lucide Icons**: Icon library for modern UI elements.

## How to Contribute

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Create a pull request on the main repository.

## License

This project is open-source and available under the [MIT License](LICENSE).

## Acknowledgements

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) for the face detection library.
- [Next.js](https://nextjs.org/) for the React framework.
- [TailwindCSS](https://tailwindcss.com/) for styling.

