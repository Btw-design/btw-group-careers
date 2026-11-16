/* ==========================================================================
   BTW Group Internship Assignment Portal: roles and questions.

   Plain English, beginner level. The multiple-choice ANSWER KEY is NOT here:
   it lives only in the Google Sheet script (docs/assignment-setup/Code.gs),
   so candidates cannot read it from the website.

   Item types:
     mcq     one correct answer, marked automatically by the sheet
     radio   one choice, not marked
     checks  tick all that apply (+ optional "other")
     text    written answer          line   one-line answer
     multi   several short lines     url    web link
   To add or change a question, edit it here. A new question automatically
   becomes a new column in the HR sheet.
   ========================================================================== */
window.BTW_PORTAL = {
    applyBase: 'https://hr.btwgroup.co/apply?job=',
    candidateTypes: ['Student', 'Recent graduate', 'Working professional', 'Taking a career break', 'Other'],
    roles: {
        'digital-marketing-intern': {
            role: 'Digital Marketing Intern',
            short: 'Digital Marketing',
            time: '20 to 30 minutes',
            blurb: 'Show us what you know about SEO, social media and content. A few quick multiple-choice questions and some small practical tasks.',
            sections: [
                {
                    id: 'quick', title: 'Part 1: Quick check',
                    intro: 'Pick the answer you think is best. There is no negative marking. If you are not sure, take your best guess.',
                    items: [
                        { id: 'M1', type: 'mcq', label: 'What is digital marketing?', options: [
                            'Printing posters and leaflets for a local shop',
                            'Promoting products or services using the internet and digital channels',
                            'Selling products only in physical stores',
                            'Repairing computers and phones'] },
                        { id: 'M2', type: 'mcq', label: 'What does SEO stand for?', options: [
                            'Social Engagement Overview',
                            'Site Editing Operations',
                            'Search Engine Optimization',
                            'Secure Email Option'] },
                        { id: 'M3', type: 'mcq', label: 'Why is SEO important for a business?', options: [
                            'It makes the office internet faster',
                            'It helps the website show up in search results so more people can find it',
                            'It automatically creates new products',
                            'It removes the need for a website'] },
                        { id: 'M4', type: 'mcq', label: 'AEO (Answer Engine Optimization) is mainly about:', options: [
                            'Buying more ads on every platform',
                            'Making videos longer',
                            'Writing clear answers that search engines and AI assistants can use as a direct answer',
                            'Changing the colour of a website'] },
                        { id: 'M5', type: 'mcq', label: 'GEO (Generative Engine Optimization) is mainly about:', options: [
                            'Finding the location of your customers on a map',
                            'Making your brand and content easy for AI tools (like ChatGPT) to find and mention in their answers',
                            'Making a phone battery last longer',
                            'Designing logos'] },
                        { id: 'M6', type: 'mcq', label: 'Which free Google tool shows how many people visit your website?', options: [
                            'Google Docs',
                            'Google Maps',
                            'Gmail',
                            'Google Analytics'] },
                        { id: 'M7', type: 'mcq', label: 'Which one is an example of PAID marketing?', options: [
                            'Posting a free photo on your page',
                            'A customer sharing your post',
                            'Running Google Ads',
                            'A friend telling others about your shop'] },
                        { id: 'M8', type: 'mcq', label: 'What is a target audience?', options: [
                            'Everyone in the world',
                            'The people who work in your company',
                            'Your competitors',
                            'The group of people you most want to reach with your message'] }
                    ]
                },
                {
                    id: 'tools', title: 'Part 2: Tools you know',
                    intro: 'Tick what you have used or heard of. "None yet" is a perfectly good answer.',
                    items: [
                        { id: 'E1', type: 'checks', label: 'Which Google tools have you used?', options: ['Google Analytics', 'Google Search Console', 'Google Trends', 'Google Keyword Planner', 'Google Ads', 'None yet'], other: true },
                        { id: 'E2', type: 'checks', label: 'Which keyword research tools do you know?', options: ['Google Keyword Planner', 'Ubersuggest', 'Ahrefs', 'SEMrush', 'None yet'], other: true }
                    ]
                },
                {
                    id: 'practical', title: 'Part 3: Small practical tasks',
                    intro: 'Imagine you work for a visa consultancy. Keep your answers short and simple. One line is enough.',
                    items: [
                        { id: 'W1', type: 'text', label: 'In your own words, how are SEO, AEO and GEO different?', hint: 'One or two lines. Writing "not sure" is okay.', rows: 3 },
                        { id: 'P1', type: 'multi', label: 'Write 5 keywords that people may search to find a visa consultancy.', hint: 'Words or phrases people type in Google.', count: 5, prefix: 'Keyword' },
                        { id: 'P2', type: 'multi', label: 'Suggest 3 social media post ideas for a visa consultancy.', hint: 'One line for each idea.', count: 3, prefix: 'Idea' },
                        { id: 'P3', type: 'text', label: 'Write a short Instagram caption for a visa consultancy post.', hint: '1 or 2 lines. Try to include a useful keyword and a few hashtags.', rows: 3 },
                        { id: 'P4', type: 'multi', label: 'Name 3 ways to increase website traffic.', count: 3, prefix: 'Way' },
                        { id: 'P5', type: 'radio', label: 'Have you used ChatGPT or other AI tools for content creation or digital marketing?', options: ['Yes', 'Only a little', 'No, not yet'], follow: 'If yes, what did you use it for? (optional)' }
                    ]
                },
                {
                    id: 'you', title: 'Part 4: A little about you',
                    intro: 'Two quick questions. There are no right or wrong answers.',
                    items: [
                        { id: 'A1', type: 'text', label: 'Think of a brand whose social media post you liked recently. Which brand, and what did you like about it?', rows: 3 },
                        { id: 'A2', type: 'text', label: 'Why are you interested in this internship?', rows: 3 }
                    ]
                }
            ]
        },
        'video-editor-intern': {
            role: 'Video Editor Intern',
            short: 'Video Editing',
            time: '30 to 45 minutes',
            blurb: 'Show us how you think about video. A few quick multiple-choice questions and one small practical edit.',
            sections: [
                {
                    id: 'quick', title: 'Part 1: Quick check',
                    intro: 'Pick the answer you think is best. There is no negative marking. If you are not sure, take your best guess.',
                    items: [
                        { id: 'M1', type: 'mcq', label: 'What does the 9:16 shape mean for Instagram Reels?', options: [
                            'A wide, horizontal video like a TV',
                            'A tall, vertical video: the shape used for Instagram Reels and YouTube Shorts',
                            'A square video',
                            'A video that is 9 or 16 seconds long'] },
                        { id: 'M2', type: 'mcq', label: 'What is FPS in video?', options: [
                            'Final picture size',
                            'File protection system',
                            'Frames per second: how many pictures are shown each second',
                            'Fast playback speed'] },
                        { id: 'M3', type: 'mcq', label: 'Compared with 1080p, a 4K video has:', options: [
                            'Fewer pixels',
                            'More pixels, so it can look sharper',
                            'No difference at all',
                            'Only black and white colours'] },
                        { id: 'M4', type: 'mcq', label: 'What is a "hook" in a Reel?', options: [
                            'The last line of the video',
                            'A tool to hang a camera',
                            'A type of music file',
                            'The first few seconds that make people want to keep watching'] },
                        { id: 'M5', type: 'mcq', label: 'What are subtitles (captions) mainly used for?', options: [
                            'To show spoken words as text so people can follow even without sound',
                            'To make the video file smaller',
                            'To change the video colour',
                            'To remove background noise'] },
                        { id: 'M6', type: 'mcq', label: 'What is a transition?', options: [
                            'A kind of microphone',
                            'A file format',
                            'An effect that smoothly connects one clip to the next',
                            'The title of the video'] },
                        { id: 'M7', type: 'mcq', label: 'Which export setting is best for an Instagram Reel?', options: [
                            'Horizontal 1920 x 1080',
                            'Tiny 240p',
                            'Audio only',
                            'Vertical 1080 x 1920 (1080p), MP4'] }
                    ]
                },
                {
                    id: 'tools', title: 'Part 2: About your experience',
                    intro: 'Be honest. Beginners are welcome. "None yet" is a perfectly good answer.',
                    items: [
                        { id: 'E1', type: 'checks', label: 'Which video editing software do you know?', options: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'CapCut', 'VN', 'InShot', 'None yet'], other: true },
                        { id: 'E2', type: 'radio', label: 'How much video editing experience do you have?', options: ['No experience yet (I am a fresher)', 'Less than 6 months', '6 to 12 months', 'More than 1 year'] },
                        { id: 'E3', type: 'radio', label: 'Do you know how to create Instagram Reels and YouTube Shorts?', options: ['Yes', 'A little', 'Not yet, but I want to learn'] },
                        { id: 'E4', type: 'checks', label: 'Do you know how to add these to a video?', hint: 'Tick all that you can do.', options: ['Subtitles', 'Transitions', 'Background music', 'Sound effects', 'None yet'] },
                        { id: 'E5', type: 'radio', label: 'Have you used AI tools for video editing?', options: ['Yes', 'No, not yet'], follow: 'If yes, which tools? (optional)' }
                    ]
                },
                {
                    id: 'practical', title: 'Part 3: One small practical edit',
                    intro: 'Make one short Reel. Take any video of about 30 seconds. It can be a clip from your phone, or free footage from a site like Pexels or Pixabay.',
                    checklist: [
                        'Edit the video into an engaging Instagram Reel.',
                        'Add suitable background music, subtitles and simple transitions.',
                        'Create an interesting opening hook (the first 3 seconds should make people want to keep watching).',
                        'Export the final video in 1080p vertical format (1080 x 1920).'
                    ],
                    items: [
                        { id: 'P1', type: 'url', label: 'Link to your finished Reel', hint: 'Upload it to Google Drive (set to "anyone with the link can view") or YouTube (unlisted), then paste the link here. No video ready yet? That is okay. Leave this empty and submit your answers.', placeholder: 'https://' },
                        { id: 'P2', type: 'line', label: 'Which app or software did you use?', placeholder: 'For example CapCut, VN, Premiere Pro' },
                        { id: 'P3', type: 'text', label: 'What was your opening hook? (1 or 2 lines)', rows: 2 },
                        { id: 'P4', type: 'checks', label: 'Before you send, please check:', options: ['I exported in 1080p vertical (1080 x 1920)', 'I added music and subtitles'] }
                    ]
                },
                {
                    id: 'you', title: 'Part 4: A little about you',
                    intro: 'Two quick questions. There are no right or wrong answers.',
                    items: [
                        { id: 'A1', type: 'text', label: 'Share one Instagram Reel or YouTube Short you like. What did you like about it?', rows: 3 },
                        { id: 'A2', type: 'text', label: 'Why are you interested in this internship?', rows: 3 }
                    ]
                }
            ]
        }
    }
};
