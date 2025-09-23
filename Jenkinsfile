pipeline {
    // กำหนดให้ Jenkins ทำงานบน agent ใดก็ได้ (เหมาะสำหรับ Windows)
    agent none

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-cred')
        DOCKER_REPO = "iamsamitdev/express-docker-app"
        // APP_NAME = "express-docker-app"
        // DEPLOY_SERVER = "user@your-server-ip"
    }

    stages {
        // STAGE 1: ทำทุกอย่างเกี่ยวกับ Node.js ใน Container
        stage('Build and Test') {
            agent {
                docker {
                    image 'node:22-alpine'
                    // customWorkspace ยังคงจำเป็น แต่เราจะควบคุมการ checkout เอง
                    customWorkspace '/app'
                }
            }
            // เพิ่ม options นี้เพื่อไม่ให้ Jenkins checkout โค้ดอัตโนมัติ (ซึ่งเป็นต้นเหตุของปัญหา)
            options {
                skipDefaultCheckout true
            }
            steps {
                // 1. Checkout โค้ดด้วยตัวเอง *หลังจาก* เข้ามาใน container แล้ว
                checkout scm

                // 2. รันคำสั่ง npm ตามปกติ ซึ่งตอนนี้จะทำงานใน /app ภายใน container
                echo '--- Installing Dependencies & Running Tests ---'
                sh 'npm install && npm test'

                // 3. บันทึกไฟล์ทั้งหมดใน workspace ไว้สำหรับ stage ต่อไป
                echo '--- Stashing workspace for next stage ---'
                stash name: 'source', includes: '**/*'
            }
        }

        // STAGE 2: สร้างและ Push Docker Image บน Host
        stage('Build and Push Docker Image') {
            // ใช้ agent any เพื่อกลับมาทำงานบน Jenkins Host ที่คุยกับ Docker Desktop ได้
            agent any
            steps {
                // 1. นำไฟล์ที่บันทึกไว้จาก stage ก่อนหน้ากลับมาใช้
                echo '--- Unstashing workspace ---'
                unstash 'source'

                // 2. รันคำสั่ง docker build และ push ตามปกติ
                echo '--- Building and Pushing Docker Image ---'
                script {
                    def dockerImage = docker.build("${DOCKER_REPO}:${env.BUILD_NUMBER}")
                    docker.withRegistry('https://index.docker.io/v1/', DOCKER_HUB_CREDENTIALS) {
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
