const wpfc26Frames = [
  {
    id: 'attending',
    label: 'Attending',
    caption: "I'm attending",
    src: '/assets/events/wpfc26/frames/attending.png',
    photoArea: { x: 610, y: 253, width: 307, height: 310, radius: 42 }
  },
  {
    id: 'organizing',
    label: 'Organizing',
    caption: "I'm organizing",
    src: '/assets/events/wpfc26/frames/organizing.png',
    photoArea: { x: 615, y: 259, width: 299, height: 300, radius: 42 }
  },
  {
    id: 'speaking',
    label: 'Speaking',
    caption: "I'm speaking",
    src: '/assets/events/wpfc26/frames/speaking.png',
    photoArea: { x: 615, y: 259, width: 299, height: 299, radius: 42 }
  },
  {
    id: 'sponsor',
    label: 'Sponsoring',
    caption: "We're sponsoring",
    src: '/assets/events/wpfc26/frames/sponsor.png',
    photoArea: { x: 615, y: 259, width: 299, height: 299, radius: 42 }
  },
  {
    id: 'volunteering',
    label: 'Volunteering',
    caption: "I'm volunteering",
    src: '/assets/events/wpfc26/frames/volunteering.png',
    photoArea: { x: 610, y: 253, width: 310, height: 310, radius: 42 }
  }
];

const legacyFrames = [
  { id: 'attendee', label: 'Attendee', caption: 'Attendee', src: '/assets/events/wordcamp-kerala-2024/frames/attendee.png' },
  { id: 'speaker', label: 'Speaker', caption: 'Speaker', src: '/assets/events/wordcamp-kerala-2024/frames/speaker.png' },
  { id: 'sponsor', label: 'Sponsor', caption: 'Sponsor', src: '/assets/events/wordcamp-kerala-2024/frames/sponsor.png' },
  { id: 'organizer', label: 'Organizer', caption: 'Organizer', src: '/assets/events/wordcamp-kerala-2024/frames/organizer.png' },
  { id: 'volunteer', label: 'Volunteer', caption: 'Volunteer', src: '/assets/events/wordcamp-kerala-2024/frames/volunteer.png' }
];

export const events = [
  {
    slug: 'wpfc26',
    status: 'active',
    title: 'WP Future Conclave 2026',
    shortTitle: 'WPFC 2026',
    dateLabel: 'September 05, 2026',
    venue: 'Govt. Cyber Park Auditorium, Calicut',
    description: 'A future-focused WordPress gathering for builders, makers, speakers, sponsors, and the wider community.',
    heroTitle: 'Show up for the future of WordPress.',
    website: 'https://events.wordpress.org/kozhikode/2026/WP-Future',
    logo: '/assets/events/wpfc26/images/logo.png',
    canvas: { width: 1080, height: 1080 },
    placeholder: '/assets/events/wpfc26/images/logo.png',
    composition: {
      mode: 'aperture',
      showProfileFields: true,
      allowGravatar: true,
      text: {
        startY: 600,
        maxWidth: 470,
        color: '#0d1f2d',
        companyColor: '#50616b',
        nameFont: '700 42px "DM Sans"',
        companyFont: '500 26px "DM Sans"',
        nameLineHeight: 48,
        companyLineHeight: 32,
        companyGap: 4
      }
    },
    downloadPrefix: 'wpfc26',
    shareMessage: 'I’m joining WP Future Conclave 2026 in Kozhikode. Come be part of the future of WordPress!',
    hashtags: ['WPFutureConclave', 'WPKerala'],
    frames: wpfc26Frames
  },
  {
    slug: 'wordcamp-kerala-2024',
    status: 'archived',
    title: 'WordCamp Kerala 2024',
    shortTitle: 'WordCamp Kerala 2024',
    dateLabel: 'November 09, 2024',
    venue: 'Malabar Marina Convention Center, Kozhikode',
    description: 'The original WP Kerala community frame collection from WordCamp Kerala 2024.',
    heroTitle: 'Revisit your WordCamp Kerala 2024 frame.',
    website: 'https://kerala.wordcamp.org/2024/',
    logo: '/assets/events/wordcamp-kerala-2024/logo.png',
    canvas: { width: 1920, height: 1920 },
    placeholder: '/assets/images/placeholder.jpg',
    composition: {
      mode: 'legacy',
      photoArea: { x: 280, y: 445, width: 560, height: 560, radius: 0 },
      nameY: 1100,
      companyY: 1165,
      showProfileFields: true,
      allowGravatar: true
    },
    downloadPrefix: 'wordcamp-kerala-2024',
    shareMessage: 'Throwback to WordCamp Kerala 2024! Made my community frame with the WP Kerala Frame Studio.',
    hashtags: ['WordCampKerala', 'WPKerala'],
    frames: legacyFrames
  }
];

export const defaultEvent = events.find((event) => event.status === 'active') ?? events[0];

export function getEvent(slug) {
  return events.find((event) => event.slug === slug) ?? defaultEvent;
}
