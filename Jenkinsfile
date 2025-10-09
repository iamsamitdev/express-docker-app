pipeline {
    // ใช้ agent any เพราะ build จะทำงานบน Jenkins controller (Linux container) อยู่แล้ว
    agent any

    // กำหนด environment variables
    environment {
        DOCKER_HUB_CREDENTIALS_ID = 'dockerhub-cred'
        DOCKER_REPO               = "iamsamitdev/express-docker-app"
        APP_NAME                  = "express-docker-app"
    }

    // กำหนด stages ของ Pipeline
    stages {

        // Stage 1: ดึงโค้ดล่าสุดจาก Git
        stage('Checkout') {
            steps {
                echo "Checking out code..."
                checkout scm
            }
        }

        // Stage 2: ติดตั้ง dependencies และ Run test
        stage('Install & Test') {
            steps {
                sh '''
                    npm install
                    npm test
                '''
            }
        }

        // Stage 3: สร้าง Docker Image
        stage('Build Docker Image') {
            steps {
                sh """
                    echo "Building Docker image: ${DOCKER_REPO}:${BUILD_NUMBER}"
                    docker build --target production -t ${DOCKER_REPO}:${BUILD_NUMBER} -t ${DOCKER_REPO}:latest .
                """
            }
        }

        // Stage 4: Push Image ไปยัง Docker Hub
        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKER_HUB_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo "Logging into Docker Hub..."
                        echo "\${DOCKER_PASS}" | docker login -u "\${DOCKER_USER}" --password-stdin
                        echo "Pushing image to Docker Hub..."
                        docker push ${DOCKER_REPO}:${BUILD_NUMBER}
                        docker push ${DOCKER_REPO}:latest
                        docker logout
                    """
                }
            }
        }

        // Stage 5: เคลียร์ Docker images บน agent
        stage('Cleanup Docker') {
            steps {
                sh """
                    echo "Cleaning up local Docker images/cache on agent..."
                    docker image rm -f ${DOCKER_REPO}:${BUILD_NUMBER} || true
                    docker image rm -f ${DOCKER_REPO}:latest || true
                    docker image prune -af || true
                    docker builder prune -af || true
                """
            }
        }

        // Stage 6: Deploy ไปยังเครื่อง local
        stage('Deploy Local') {
            steps {
                sh """
                    echo "Deploying container ${APP_NAME} from latest image..."
                    docker pull ${DOCKER_REPO}:latest
                    docker stop ${APP_NAME} || true
                    docker rm ${APP_NAME} || true
                    docker run -d --name ${APP_NAME} -p 3000:3000 ${DOCKER_REPO}:latest
                    docker ps --filter name=${APP_NAME} --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}"
                """
            }
            // ส่งข้อมูลไปยัง n8n webhook เมื่อ deploy สำเร็จ
            post {
                success {
                    script {
                        withCredentials([string(credentialsId: 'n8n-webhook', variable: 'N8N_WEBHOOK_URL')]) {
                            def payload = [
                                project  : env.JOB_NAME,
                                stage    : 'Deploy Local',
                                status   : 'success',
                                build    : env.BUILD_NUMBER,
                                image    : "${env.DOCKER_REPO}:latest",
                                container: env.APP_NAME,
                                url      : 'http://localhost:3000/',
                                timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ssXXX")
                            ]
                            def body = groovy.json.JsonOutput.toJson(payload)
                            try {
                                def conn = new java.net.URL(N8N_WEBHOOK_URL).openConnection()
                                conn.setRequestMethod('POST')
                                conn.setDoOutput(true)
                                conn.setRequestProperty('Content-Type', 'application/json')
                                conn.getOutputStream().withWriter('UTF-8') { it << body }
                                int rc = conn.getResponseCode()
                                echo "n8n webhook (success) via URLConnection, response code: ${rc}"
                            } catch (e) {
                                echo "Failed to notify n8n (success): ${e}"
                            }
                        }
                    }
                }
            }
        }
    }

    // กำหนด actions ที่จะทำหลังจาก pipeline เสร็จสิ้น
    post {
        failure {
            script {
                withCredentials([string(credentialsId: 'n8n-webhook', variable: 'N8N_WEBHOOK_URL')]) {
                    def payload = [
                        project  : env.JOB_NAME,
                        stage    : 'Pipeline',
                        status   : 'failed',
                        build    : env.BUILD_NUMBER,
                        image    : "${env.DOCKER_REPO}:latest",
                        container: env.APP_NAME,
                        url      : 'http://localhost:3000/',
                        timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ssXXX")
                    ]
                    def body = groovy.json.JsonOutput.toJson(payload)
                    try {
                        def conn = new java.net.URL(N8N_WEBHOOK_URL).openConnection()
                        conn.setRequestMethod('POST')
                        conn.setDoOutput(true)
                        conn.setRequestProperty('Content-Type', 'application/json')
                        conn.getOutputStream().withWriter('UTF-8') { it << body }
                        int rc = conn.getResponseCode()
                        echo "n8n webhook (failure) via URLConnection, response code: ${rc}"
                    } catch (e) {
                        echo "Failed to notify n8n (failure): ${e}"
                    }
                }
            }
        }
    }

}