# WordCamp Kerala 2024 Personalized Poster Generator

Generate a customized poster for WordCamp Kerala 2024 by uploading your own picture, adding your details, and applying a predefined frame.

## Features

- Upload your own picture to generate a personalized poster
- Use Gravatar for image (automatically fetched using email)
- Clear uploaded images with a single click
- Enter your name and company details
- Pre-fill user data via URL parameters
- Apply a WordCamp Kerala 2024 frame to your picture
- Preview your customized poster
- Download the generated poster
- Share the poster directly (using Web Share API where supported)

## Image Priority

The generator uses the following priority order for posters:
1. Uploaded image (if available)
2. Gravatar image (if valid email is provided via input or URL)
3. Default placeholder image (if no other image is available)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/ajithrn/wckerala-frames.git
   ```
2. Navigate to the project directory:
   ```
   cd wckerala-frames
   ```
3. Open `index.html` in your web browser or set up a local server to run the project.

## Usage

### Direct Usage
1. Click the "Upload" button to select your picture, or enter your email to use Gravatar
2. Enter your name and company name in the provided input fields
3. Click on a frame to generate your poster
4. Preview your customized poster
5. Click the "Download" button to save your poster
6. Click the "Share" button to share your poster (on supported browsers)

### URL Parameters
You can pre-fill user data using URL parameters:
```
https://frames.wpkerala.org/?name=John%20Doe&company=WordPress&email=john@example.com
```

Available parameters:
- `name`: User's name
- `company`: Company name
- `email`: Email address (will automatically fetch Gravatar if available)

## Technologies Used

- HTML5
- CSS3 (SCSS)
- JavaScript (ES6+)
- Web Share API (with fallback for unsupported browsers)
- Gravatar API
- MD5 hashing (for Gravatar integration)

## Project Structure

- `index.html`: Main HTML file
- `assets/css/main.scss`: SCSS file for styling
- `assets/css/main.min.css`: Compiled and minified CSS
- `assets/js/main.js`: JavaScript file for functionality
- `assets/frames/`: Directory containing frame images
- `assets/images/`: Directory containing project images

## Responsive Design

The application is fully responsive and works well on various device sizes, from mobile phones to desktop computers.

## Browser Compatibility

This project uses modern web technologies and is compatible with the latest versions of major browsers. The Web Share API is used for sharing, with a fallback option for unsupported browsers.

## Security

- Uses HTTPS for all external resources
- Implements proper CORS handling for images
- Secure Gravatar URL implementation
- Safe URL parameter handling

## Credits

- [WordCamp Kerala](https://kerala.wordcamp.org/2024/) for the event branding and frame design
- [Gravatar](https://gravatar.com) for profile picture integration
- Developed by [Ajith](https://ajithrn.com)

## License

This project is licensed under the [MIT License](LICENSE).

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check [issues page](https://github.com/ajithrn/wckerala-frames/issues) if you want to contribute.

## Support

If you have any questions or need help with the poster generator, please open an issue or contact the WordCamp Kerala organizers.
