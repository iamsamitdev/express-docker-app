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
        stage('Build, Test and Push') {
            // 3. กำหนด agent สำหรับ stage นี้โดยเฉพาะ
            agent {
                docker {
                    image 'node:22-alpine'
                    // ในจุดนี้ env.WORKSPACE จะพร้อมใช้งานแล้ว
                    args "-w /app -v ${env.WORKSPACE.replace('\\', '/')}:/app"
                }
            }
            steps {
                // เอางานต่างๆ มาไว้ใน steps ของ stage นี้
                echo '--- Installing Dependencies & Running Tests ---'
                sh 'npm install && npm test'

                echo '--- Building Docker Image ---'
                script {
                    // เราต้องประกาศ dockerImage ใหม่ภายใน script block
                    def dockerImage = docker.build("${DOCKER_REPO}:${env.BUILD_NUMBER}")

                    echo '--- Pushing Docker Image ---'
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
