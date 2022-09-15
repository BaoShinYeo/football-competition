# football-competition

Application is live at https://6322814fdd68dd2b50297e6e--footballcompetition.netlify.app/

## Backend APIs

### Prerequisites

1. Copy paste .env.example (found in ./backend/src) in the same folder. Rename to .env.

2. Add your AWS credentials into the .env file.

### Running the application

Backend application is running on a deployed server, but if you choose to run it locally, you can follow these instructions

1. Go to backend folder

```
cd backend
```

2. Install packages

```
npm i
```

3. Run the application.

For hot-reloading

```
npm run dev
```

No hot-reloading

```
npm run start
```

### Deploying API with Serverless Framework

```
npx serverless deploy
```

## Frontend App

### Running the application

Frontend application is running on a deployed server, but if you choose to run it locally, you can follow these instructions

1. Go to frontend folder

```
cd frontend/my-app
```

2. Install packages

```
npm i
```

3. Run the application.

```
npm run start
```
