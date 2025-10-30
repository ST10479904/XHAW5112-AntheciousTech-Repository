document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('course-form');
    const totalSpan = document.getElementById('total-price');

    if (form && totalSpan) {
        form.addEventListener('change', function() {
            let total = 0;
            const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
            
            checkboxes.forEach(function(checkbox) {
                const price = parseInt(checkbox.dataset.price);
                if (!isNaN(price)) {
                    total += price;
                }
            });
            
            totalSpan.textContent = `R ${total}`;
        });
    } else {
        console.error("Required elements not found. Check your HTML IDs.");
    }
});