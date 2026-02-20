// contact-form.js

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const messageBox = document.getElementById('message-box');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Clear previous messages
        messageBox.textContent = '';

        // Validate the form
        if (!validateForm(form)) {
            messageBox.textContent = 'Please fill all fields correctly.';
            return;
        }

        // Show loading state
        messageBox.textContent = 'Sending...';

        // Prepare form data
        const formData = new FormData(form);

        // AJAX submission
        fetch('contact-handler.php', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                messageBox.textContent = 'Message sent successfully!';
                form.reset(); // Reset the form on success
            } else {
                messageBox.textContent = 'Error: ' + data.message;
            }
        })
        .catch(error => {
            messageBox.textContent = 'Error sending message. Please try again later.';
            console.error('Error:', error);
        });
    });

    function validateForm(form) {
        let isValid = true;

        // Example validations
        const email = form['email'].value;
        const message = form['message'].value;

        if (!email || !message) {
            isValid = false;
        }

        // Simple email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            isValid = false;
        }

        return isValid;
    }
});