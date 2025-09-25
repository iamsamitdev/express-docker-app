pipeline {
    // ใช้ Docker agent ที่รองรับทุก platform (Linux/MacOS/Windows)
    agent {
        docker { 
            image 'node:22-alpine'
            // reuseNode เพื่อใช้ workspace เดียวกันกับ host
            reuseNode true
        }
    }

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-cred')
        DOCKER_REPO = "iamsamitdev/express-docker-app"
        // APP_NAME = "express-docker-app"
        // DEPLOY_SERVER = "user@your-server-ip"
    }

    stages {
        // Stage 1: ดึงโค้ดล่าสุดจาก Git
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }

        // Stage 2: ติดตั้ง dependencies และรันเทสต์ (ใน Docker container)
        stage('Install & Test') {
            steps {
                // ใช้ sh เพราะทำงานใน Linux container (Docker)
                sh 'npm install'
                sh 'npm test'
            }
        }

        // Stage 3: สร้าง Docker Image สำหรับ production
        stage('Build Docker Image') {
            // ใช้ any agent เพื่อเข้าถึง Docker daemon ของ host
            agent any
            steps {
                script {
                    echo "Building Docker image: ${DOCKER_REPO}:${BUILD_NUMBER}"
                    def prodImage = docker.build("${DOCKER_REPO}:${BUILD_NUMBER}", "--target production .")
                    // เก็บ image ไว้ใช้ใน stage ถัดไป
                    env.DOCKER_IMAGE_ID = prodImage.id
                }
            }
        }

        // Stage 4: Push Image ไปยัง Docker Hub
        stage('Push to Docker Hub') {
            // ใช้ any agent เพื่อเข้าถึง Docker daemon ของ host
            agent any
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', DOCKER_HUB_CREDENTIALS) {
                        echo "Pushing image to Docker Hub..."
                        def image = docker.image("${DOCKER_REPO}:${BUILD_NUMBER}")
                        image.push()
                        image.push('latest')
                    }
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
    // }

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
