pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/madiha786786/club-management-system.git'
            }
        }

        stage('Build') {
            steps {
                echo "Building project..."
            }
        }

        stage('Test') {
            steps {
                echo "Testing..."
            }
        }

        stage('Deploy') {
            steps {
                echo "Deployment step (dummy for now)"
            }
        }
    }
}
