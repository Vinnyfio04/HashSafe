Project Title 
HashSafe: A Data Hashing Software

Short Description 
HashSafe is an application that secures user generated content like photos and videos by turning them into unique cryptographic hash values and then storing them in a database for users to track. 

Why This Is Needed 
This type of technology is needed in the near future due to the rapid evolution of AI technology. In the past, it was obvious when something was AI generated. Now, AI gets more accurate and realistic by the day. This is already worrying enough, but as the quality grows, the wider reach it has; As in, the common man has access to it. This may easily lead to serious fabricated evidence to slander or tarnish someone’s career, at the very least. This solution may not be a perfect one, but it's a step towards solving it. 

////////////////////////////////////////////////////////


/////////Set up/////////

1) Enter "npm install" to install all dependencies from the package.json
2) Run front end (react): "npm run dev"
3) Run server: "npm run server"
4) Open react front end from terminal

/////////How to use the system/////////

1) Create an account by typing in your name, email, and password.
2) Sign in with your newly created account
3) Upload at least one hash
   1) While selecting file and either drag and drop or browse your file system to upload a photo or video.
      1) Or select text and fill out the required fields.
   2) Hit Upload & Generate Hash when file is uploaded
   3) Examine the hash that appears
4) View hashes under the hashes tab
5) View the content under the content tab
6) Verify your hashes
   1) Upload the same exact file as you did before (or the exact text you uploaded)
   2) Click on Compute Hash
   3) Click the verify button when your hash appears
   4) Click verify hash once the text field populates with the new hash
   5) Examine the hash verification
7) Verify content that has not been uploaded
   1) Under the verify tab, upload text or a file that is not stored in content
   2) Repeat sub-steps 2-5 in step 6
   3) Notice the Not Found message

You can also delete stored hashes and content in the respective tabs and sign out on the top right if you would like. That concludes the step-by-step guide on running our system!