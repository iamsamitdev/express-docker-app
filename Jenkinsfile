pipeline {
    // ใช้ any agent เพื่อหลีกเลี่ยงปัญหา Docker path mounting บน Windows
    agent any

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

        // Stage 2: ติดตั้ง dependencies และรันเทสต์ (รองรับทุก Platform)
        stage('Install & Test') {
            steps {
                script {
                    // ตรวจสอบว่ามี Node.js บน host หรือไม่
                    def hasNodeJS = false
                    def isWindows = isUnix() ? false : true
                    
                    try {
                        if (isWindows) {
                            bat 'node --version && npm --version'
                        } else {
                            sh 'node --version && npm --version'
                        }
                        hasNodeJS = true
                        echo "Using Node.js installed on ${isWindows ? 'Windows' : 'Unix'}"
                    } catch (Exception e) {
                        echo "Node.js not found on host, using Docker"
                        hasNodeJS = false
                    }
                    
                    if (hasNodeJS) {
                        // ใช้ Node.js บน host
                        if (isWindows) {
                            bat '''
                                npm install
                                npm test
                            '''
                        } else {
                            sh '''
                                npm install
                                npm test
                            '''
                        }
                    } else {
                        // ใช้ Docker run command (รองรับทุก platform)
                        if (isWindows) {
                            bat '''
                                docker run --rm ^
                                -v "%cd%":/workspace ^
                                -w /workspace ^
                                node:22-alpine sh -c "npm install && npm test"
                            '''
                        } else {
                            sh '''
                                docker run --rm \\
                                -v "$(pwd)":/workspace \\
                                -w /workspace \\
                                node:22-alpine sh -c "npm install && npm test"
                            '''
                        }
                    }
                }
            }
        }

        // Stage 3: สร้าง Docker Image สำหรับ production
        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${DOCKER_REPO}:${BUILD_NUMBER}"
                    docker.build("${DOCKER_REPO}:${BUILD_NUMBER}", "--target production .")
                }
            }
        }

        // Stage 4: Push Image ไปยัง Docker Hub
        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_HUB_CREDENTIALS}") {
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
