pipeline {
    // กำหนดให้ Jenkins ทำงานภายใน Docker container ที่ใช้ image ของ Node.js
    agent {
        docker {
            image 'node:22-alpine'
            args "-w /app -v ${workspace.replace('\\', '/')}:/app"
        }
    }

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-cred')
        DOCKER_REPO = "iamsamitdev/express-docker-app"
        // APP_NAME = "express-docker-app"
        // DEPLOY_SERVER = "user@your-server-ip"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/iamsamitdev/express-docker-app.git'
            }
        }

        stage('Install & Test') {
            steps {
                // เราใช้ sh ได้เลย เพราะคำสั่งนี้จะถูกรันใน container ซึ่งเป็น Linux
                echo 'Running inside a Node.js Docker container'
                sh 'npm install'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${DOCKER_REPO}:${BUILD_NUMBER}")
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_HUB_CREDENTIALS}") {
                        dockerImage.push()
                        dockerImage.push("latest")
                    }
                }
            }
        }

        // stage('Deploy to Server') {
        //     steps {
        //         sshagent(['deploy-server-cred']) {
        //             sh """
        //                 ssh -o StrictHostKeyChecking=no $DEPLOY_SERVER '
        //                     docker pull ${DOCKER_REPO}:latest &&
        //                     docker stop ${APP_NAME} || true &&
        //                     docker rm ${APP_NAME} || true &&
        //                     docker run -d --name ${APP_NAME} -p 3000:3000 ${DOCKER_REPO}:latest
        //                 '
        //             """
        //         }
        //     }
        // }

        // stage('Send Notification (n8n)') {
        //     steps {
        //         sh """
        //         curl -X POST https://n8n.yourdomain/webhook/deploy_notify \\
        //             -H 'Content-Type: application/json' \\
        //             -d '{"project":"${APP_NAME}","status":"success","build":"${BUILD_NUMBER}"}'
        //         """
        //     }
        // }
    }

    // post {
    //     failure {
    //         sh """
    //         curl -X POST https://n8n.yourdomain/webhook/deploy_notify \\
    //             -H 'Content-Type: application/json' \\
    //             -d '{"project":"${APP_NAME}","status":"failed","build":"${BUILD_NUMBER}"}'
    //         """
    //     }
    // }
}
