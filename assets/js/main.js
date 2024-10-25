/**
 * WordCamp Kerala Profile Picture Frame Generator
 * Ver: 2.5
 * Author: Ajith
 * URL: https://ajithrn.com
 * JS
 */

class FrameGenerator {
  constructor() {
    // Initialize DOM elements
    this.resultCanvas = document.getElementById('resultCanvas');
    this.ctx = this.resultCanvas.getContext('2d');
    this.previewImage = document.getElementById('previewImage');
    this.clearImageBtn = document.getElementById('clearImage');
    this.framesContainer = document.getElementById('framesContainer');

    // Initialize state variables
    this.uploadedImage = null;
    this.selectedFrame = null;

    // Set up the application
    this.initCanvas();
    this.bindEvents();
    this.initializeFrames();
    this.autofillForm();
  }

  // Set canvas dimensions
  initCanvas() {
    this.resultCanvas.width = 1920;
    this.resultCanvas.height = 1920;
  }

  // Bind event listeners to DOM elements
  bindEvents() {
    document.getElementById('uploadImage').addEventListener('change', this.handleImageUpload.bind(this));
    document.getElementById('userName').addEventListener('input', this.renderCompositeImage.bind(this));
    document.getElementById('companyName').addEventListener('input', this.renderCompositeImage.bind(this));
    this.clearImageBtn.addEventListener('click', this.clearUploadedImage.bind(this));
    document.getElementById('downloadBtn').addEventListener('click', this.downloadImage.bind(this));
    document.getElementById('shareBtn').addEventListener('click', this.shareImage.bind(this));
  }

  // Parse URL parameters
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      name: params.get('name'),
      company: params.get('company'),
      email: params.get('email')
    };
  }

  // Autofill form fields from URL parameters
  autofillForm() {
    const params = this.getUrlParams();
    if (params.name) document.getElementById('userName').value = params.name;
    if (params.company) document.getElementById('companyName').value = params.company;
    if (params.email) document.getElementById('email').value = params.email;
    this.renderCompositeImage();
  }

  // Clear the uploaded image
  clearUploadedImage() {
    this.uploadedImage = null;
    document.getElementById('uploadImage').value = '';
    this.clearImageBtn.style.display = 'none';
    if (this.selectedFrame) {
      this.renderCompositeImage();
    }
  }

  // Handle image upload event
  handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedImage = new Image();
        this.uploadedImage.onload = () => {
          this.clearImageBtn.style.display = 'inline-block';
          this.renderCompositeImage();
        };
        this.uploadedImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get user image (uploaded, Gravatar, or default)
  getUserImage() {
    return new Promise((resolve) => {
      // Priority 1: Use uploaded image if available
      if (this.uploadedImage) {
        resolve(this.uploadedImage);
        return;
      }

      // Priority 2: Fetch Gravatar if email is valid
      const email = document.getElementById('email').value.trim();
      if (email && this.isValidEmail(email)) {
        const hash = md5(email.toLowerCase());
        const gravatarUrl = `https://secure.gravatar.com/avatar/${hash}?s=560&d=404`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Fallback to default Gravatar
          img.src = `https://secure.gravatar.com/avatar/00000000000000000000000000000000?s=560&d=mp`;
        };
        img.src = gravatarUrl;
      } else {
        // Priority 3: Fallback to default avatar
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.src = `https://secure.gravatar.com/avatar/00000000000000000000000000000000?s=560&d=mp`;
      }
    });
  }

  // Crop and position the image within the specified area
  cropAndPositionImage(imageObj, context) {
    const targetWidth = 560;
    const targetHeight = 560;
    const targetAspectRatio = targetWidth / targetHeight;

    let sourceWidth, sourceHeight, sourceX, sourceY;

    if (imageObj.width / imageObj.height > targetAspectRatio) {
      sourceHeight = imageObj.height;
      sourceWidth = sourceHeight * targetAspectRatio;
      sourceX = (imageObj.width - sourceWidth) / 2;
      sourceY = 0;
    } else {
      sourceWidth = imageObj.width;
      sourceHeight = sourceWidth / targetAspectRatio;
      sourceX = 0;
      sourceY = (imageObj.height - sourceHeight) / 2;
    }

    context.drawImage(
      imageObj,
      sourceX, sourceY,
      sourceWidth, sourceHeight,
      280, 445,
      targetWidth, targetHeight
    );
  }

  // Render text on the canvas with word wrapping
  renderText(context, text, y, font, color, maxWidth) {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'top';
    
    const centerX = (280 + 840) / 2;
    const words = text.split(' ');
    let line = '';
    let lineY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, centerX, lineY);
        line = words[n] + ' ';
        lineY += 50;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, centerX, lineY);
  }

  // Render the composite image with user image, frame, and text
  async renderCompositeImage() {
    if (!this.selectedFrame) return;

    const userImage = await this.getUserImage();
    
    this.ctx.clearRect(0, 0, this.resultCanvas.width, this.resultCanvas.height);
    this.cropAndPositionImage(userImage, this.ctx);
    this.ctx.drawImage(this.selectedFrame, 0, 0, this.resultCanvas.width, this.resultCanvas.height);

    const name = document.getElementById('userName').value;
    this.renderText(this.ctx, name, 1100, 'bold 48px Poppins', '#000000', 560);

    const company = document.getElementById('companyName').value;
    this.renderText(this.ctx, company, 1165, '30px Poppins', '#000000', 560);

    this.updatePreviewImage();
  }

  // Update the preview image with the current canvas content
  updatePreviewImage() {
    this.previewImage.src = this.resultCanvas.toDataURL('image/png');
    this.previewImage.style.display = 'block';
  }

  // Download the generated image
  downloadImage() {
    const downloadLink = document.createElement('a');
    downloadLink.href = this.resultCanvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    downloadLink.download = 'wordcamp_kerala_personal_poster.png';
    downloadLink.click();
  }

  // Share the generated image using Web Share API or fallback to social share links
  shareImage() {
    if (navigator.share) {
      this.resultCanvas.toBlob((blob) => {
        const file = new File([blob], 'wordcamp_kerala_personal_poster.png', {
          type: 'image/png',
        });
        navigator
          .share({
            files: [file],
            title: 'Save the date for WordCamp Kerala 2024!',
            text: "Let's connect at the event! Don't miss out.",
            url: "https://kerala.wordcamp.org/2024/"
          })
          .then(() => console.log('Share was successful.'))
          .catch(console.error);
      }, 'image/png');
    } else {
      // Fallback to displaying social share links
      const fallbackShareLinks = document.getElementById('fallbackShare');
      fallbackShareLinks.classList.add('visible');

      // TODO: Implement fallback social share options
      this.updateFallbackShareLinks();
    }
  }

  // Update fallback share links with the current photo URL
  updateFallbackShareLinks() {
    const fallbackShareLinks = document.getElementById('fallbackShare');
    const currentPhotoUrl = this.resultCanvas.toDataURL('image/png');
    
    fallbackShareLinks.querySelectorAll('a').forEach(function(anchor) {
      const originalHref = anchor.href;
      const service = anchor.textContent.toLowerCase();
      
      if (service === 'facebook' || service === 'twitter' || service === 'linkedin') {
        // Replace 'URL' in each service's URL with the encoded photo URL
        anchor.href = originalHref.replace('URL', encodeURIComponent(currentPhotoUrl));
      }
    });
  }

  // Get absolute URL for a given image path
  getAbsoluteImageUrl(imagePath) {
    const baseUrl = window.location.href;
    const absoluteUrl = new URL(imagePath, baseUrl).href;
    return absoluteUrl;
  }

  // Initialize frame options
  initializeFrames() {
    const frameSource = [
      this.getAbsoluteImageUrl('assets/frames/attendee-tag.png'),
      this.getAbsoluteImageUrl('assets/frames/speaker-tag.png'),
      this.getAbsoluteImageUrl('assets/frames/sponsor-tag.png'),
      this.getAbsoluteImageUrl('assets/frames/organizer-tag.png'),
      this.getAbsoluteImageUrl('assets/frames/volunteer-tag.png'),
    ];
    frameSource.forEach((src) => {
      const frameImg = new Image();
      frameImg.crossOrigin = 'anonymous';
      frameImg.src = src;
      frameImg.onload = function() {
        this.style.display = 'inline-block';
        this.style.cursor = 'pointer';
      };
      frameImg.onclick = () => {
        this.selectedFrame = frameImg;
        this.renderCompositeImage();
      };
      this.framesContainer.appendChild(frameImg);
    });
  }
}

// Initialize the FrameGenerator when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FrameGenerator();
});

