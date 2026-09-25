$(document).ready(function () {
    // Initialize AOS Animation
    AOS.init({
        duration: 1000,
        once: true
    });

    // Dark/Light Theme Toggle
    $('#themeToggle').on('click', function () {
        $('body').toggleClass('dark-mode');
        const isDark = $('body').hasClass('dark-mode');
        $(this).html(isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Load Saved Theme
    if (localStorage.getItem('theme') === 'dark') {
        $('body').addClass('dark-mode');
        $('#themeToggle').html('<i class="fas fa-sun"></i>');
    }

    // Counter Animation on Scroll
    let animatedCounters = false;
    $(window).on('scroll', function () {
        const aboutOffset = $('#about').length ? $('#about').offset().top - 450 : 0;
        if ($(window).scrollTop() > aboutOffset && !animatedCounters) {
            $('.counter').each(function () {
                const $this = $(this);
                const countTo = $this.attr('data-target');
                $({ countNum: 0 }).animate({
                    countNum: countTo
                }, {
                    duration: 2000,
                    easing: 'swing',
                    step: function () {
                        $this.text(Math.floor(this.countNum));
                    },
                    complete: function () {
                        $this.text(this.countNum + '+');
                    }
                });
            });
            animatedCounters = true;
        }
    });

    // Course Search Filter
    $('#courseSearch').on('keyup', function () {
        const query = $(this).val().toLowerCase();
        $('.course-item').each(function () {
            const title = $(this).attr('data-title').toLowerCase();
            const text = $(this).text().toLowerCase();
            if (title.indexOf(query) > -1 || text.indexOf(query) > -1) {
                $(this).fadeIn(300);
            } else {
                $(this).fadeOut(300);
            }
        });
    });

    // Course Details Database for Admission Slip
    const courseDetailsMap = {
        "Advanced Fashion Designing": { duration: "12 Months (1 Year)", fee: "Rs.85,000", registration: "Rs.5,000", batchStart: "1st & 15th of Every Month", timing: "10:00 AM - 01:00 PM / 02:00 PM - 05:00 PM" },
        "Pattern Making & Draping": { duration: "6 Months", fee: "Rs.45,000", registration: "Rs.3,000", batchStart: "10th of Every Month", timing: "10:30 AM - 01:30 PM" },
        "Bridal & Couture Design": { duration: "6 Months", fee: "Rs.55,000", registration: "Rs.5,000", batchStart: "5th of Every Month", timing: "02:00 PM - 05:00 PM" },
        "Fashion Boutique Management": { duration: "3 Months", fee: "Rs.30,000", registration: "Rs.2,000", batchStart: "1st of Every Month", timing: "11:00 AM - 01:00 PM" },
        "Digital & Manual Illustration": { duration: "4 Months", fee: "Rs.35,000", registration: "Rs.2,000", batchStart: "15th of Every Month", timing: "03:00 PM - 05:00 PM" },
        "Embroidery & Surface Design": { duration: "3 Months", fee: "Rs.25,000", registration: "Rs.2,000", batchStart: "20th of Every Month", timing: "10:00 AM - 12:30 PM" }
    };

    // Store slip data for PDF generation (avoids any DOM/html2canvas issues)
    let currentSlipData = null;

    // Submit Admission Form & Generate Printable Slip
    $('#admissionForm').on('submit', function (e) {
        e.preventDefault();

        const formData = {
            name: $('#name').val(),
            email: $('#email').val(),
            phone: $('#phone').val(),
            city: $('#city').val(),
            course_interested: $('#course').val(),
            message: $('#message').val()
        };

        const $btn = $(this).find('button[type="submit"]');
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i> Generating Slip...');

        const selectedCourse = courseDetailsMap[formData.course_interested] || {
            duration: "6 Months", fee: "Rs.45,000", registration: "Rs.3,000", batchStart: "Next Upcoming Batch", timing: "Regular Morning / Afternoon Slots"
        };

        const regNo = 'AFA-' + Math.floor(100000 + Math.random() * 900000);
        const todayDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

        // Save all data so PDF can be built from variables (no DOM capture needed)
        currentSlipData = { formData, selectedCourse, regNo, todayDate };

        $.ajax({
            url: '/api/enquiries',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                $('#formMessage')
                    .removeClass('d-none alert-danger')
                    .addClass('alert alert-success mt-3')
                    .html('&#10024; <strong>Application Submitted Successfully!</strong><br>Registration No: <strong>' + regNo + '</strong>.<br><button id="openSlipBtn" class="btn btn-gold btn-sm mt-2"><i class="fas fa-file-pdf me-1"></i> View &amp; Download Admission Slip PDF</button>');

                // Build Slip HTML for display inside modal
                var slipHtml = '<div id="pdfPrintArea" style="background:#FFF8F0;padding:25px;border:2px solid #D4AF37;border-radius:12px;font-family:Poppins,sans-serif;color:#222;">'
                    + '<div style="text-align:center;border-bottom:2px dashed #D4AF37;padding-bottom:15px;margin-bottom:20px;">'
                    + '<img src="public/images/logo.png" alt="Logo" style="width:70px;height:70px;margin-bottom:8px;object-fit:contain;">'
                    + '<h2 style="font-family:Playfair Display,serif;color:#111;margin:0;font-weight:bold;letter-spacing:1px;">ABHISHREE</h2>'
                    + '<p style="margin:4px 0 0;font-size:12px;color:#D4AF37;font-weight:600;text-transform:uppercase;">DESIGNERS &amp; FASHION ACADEMY</p>'
                    + '<p style="margin:2px 0 0;font-size:11px;color:#666;">Fashion Hub, Main Blvd, Mumbai | +91 98765 43210 | info@abhishredesigners.com</p>'
                    + '</div>'
                    + '<div style="background:#111;color:#D4AF37;padding:8px 15px;border-radius:6px;font-weight:bold;font-size:14px;text-align:center;margin-bottom:20px;">OFFICIAL ADMISSION CONFIRMATION &amp; FEE SLIP</div>'
                    + '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">'
                    + '<tr><td style="padding:6px;font-weight:bold;width:30%;color:#555;">Registration No:</td><td style="padding:6px;font-weight:bold;color:#111;">' + regNo + '</td><td style="padding:6px;font-weight:bold;width:20%;color:#555;">Date:</td><td style="padding:6px;font-weight:bold;color:#111;">' + todayDate + '</td></tr>'
                    + '<tr><td style="padding:6px;font-weight:bold;color:#555;">Student Name:</td><td style="padding:6px;color:#111;">' + escapeHtml(formData.name) + '</td><td style="padding:6px;font-weight:bold;color:#555;">City:</td><td style="padding:6px;color:#111;">' + escapeHtml(formData.city) + '</td></tr>'
                    + '<tr><td style="padding:6px;font-weight:bold;color:#555;">Mobile / Phone:</td><td style="padding:6px;color:#111;">' + escapeHtml(formData.phone) + '</td><td style="padding:6px;font-weight:bold;color:#555;">Email:</td><td style="padding:6px;color:#111;">' + escapeHtml(formData.email) + '</td></tr>'
                    + '</table>'
                    + '<div style="border:1px solid #E2E2DC;background:#FFF;border-radius:8px;padding:15px;margin-bottom:20px;">'
                    + '<h4 style="font-family:Playfair Display,serif;color:#D4AF37;margin-top:0;font-size:16px;border-bottom:1px solid #EEE;padding-bottom:8px;">&#127891; Selected Course &amp; Batch Details</h4>'
                    + '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
                    + '<tr><td style="padding:6px 0;font-weight:bold;width:35%;">Selected Course:</td><td style="padding:6px 0;font-weight:bold;color:#111;">' + escapeHtml(formData.course_interested) + '</td></tr>'
                    + '<tr><td style="padding:6px 0;font-weight:bold;">Course Duration:</td><td style="padding:6px 0;color:#333;">' + selectedCourse.duration + '</td></tr>'
                    + '<tr><td style="padding:6px 0;font-weight:bold;">Batch Schedule:</td><td style="padding:6px 0;color:#333;">Starts ' + selectedCourse.batchStart + '</td></tr>'
                    + '<tr><td style="padding:6px 0;font-weight:bold;">Daily Class Timings:</td><td style="padding:6px 0;color:#333;">' + selectedCourse.timing + '</td></tr>'
                    + '</table></div>'
                    + '<div style="border:1px solid #E2E2DC;background:#FFF;border-radius:8px;padding:15px;margin-bottom:20px;">'
                    + '<h4 style="font-family:Playfair Display,serif;color:#D4AF37;margin-top:0;font-size:16px;border-bottom:1px solid #EEE;padding-bottom:8px;">&#128179; Fee Breakdown &amp; Payment Summary</h4>'
                    + '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
                    + '<tr style="border-bottom:1px solid #F0F0F0;"><td style="padding:8px 0;color:#555;">Total Course Tuition Fee:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#111;">' + selectedCourse.fee + '</td></tr>'
                    + '<tr style="border-bottom:1px solid #F0F0F0;"><td style="padding:8px 0;color:#555;">Seat Reservation / Reg. Fee:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#D4AF37;">' + selectedCourse.registration + '</td></tr>'
                    + '<tr style="border-bottom:1px solid #F0F0F0;"><td style="padding:8px 0;color:#555;">Payment Mode Available:</td><td style="padding:8px 0;text-align:right;color:#333;">UPI / NetBanking / Debit Card / EMI</td></tr>'
                    + '<tr><td style="padding:8px 0;font-weight:bold;color:#111;">Application Status:</td><td style="padding:8px 0;text-align:right;"><span style="background:#28a745;color:#FFF;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:bold;">CONFIRMED &amp; PROCESSED</span></td></tr>'
                    + '</table></div>'
                    + '<div style="font-size:11px;color:#777;border-top:1px solid #DDD;padding-top:10px;text-align:center;">* Note: Please present this slip or Registration No (<strong>' + regNo + '</strong>) at the academy desk during counselor verification.</div>'
                    + '</div>';

                $('#slipReceiptContent').html(slipHtml);

                $('#openSlipBtn').off('click').on('click', function () {
                    var slipModal = new bootstrap.Modal(document.getElementById('slipModal'));
                    slipModal.show();
                });

                var slipModal = new bootstrap.Modal(document.getElementById('slipModal'));
                slipModal.show();

                $('#admissionForm')[0].reset();
            },
            error: function (err) {
                $('#formMessage')
                    .removeClass('d-none alert-success')
                    .addClass('alert alert-danger mt-3')
                    .text('Failed to submit application. Please try again or contact us on WhatsApp.');
            },
            complete: function () {
                $btn.prop('disabled', false).text('Submit Application');
            }
        });
    });

    // Handle Print Slip Button
    $(document).on('click', '#printSlipBtn', function () {
        window.print();
    });

    // Handle PDF Download - Pure jsPDF (NO html2canvas, NO DOM capture)
    // Builds PDF directly from stored JS variables - always works regardless of modal/scroll state
    $(document).on('click', '#downloadSlipBtn', function () {
        if (!currentSlipData) {
            alert('No slip data found. Please submit the form first.');
            return;
        }

        var d = currentSlipData;
        var $btn = $(this);
        var originalText = $btn.html();
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i> Generating PDF...');

        try {
            var jsPDFConstructor = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
            var doc = new jsPDFConstructor({ orientation: 'p', unit: 'mm', format: 'a4' });

            var pageW = 210;
            var margin = 14;
            var cW = pageW - margin * 2;
            var y = 12;

            // Gold outer border
            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(1.2);
            doc.rect(7, 7, pageW - 14, 280);

            // Header dark bg
            doc.setFillColor(17, 17, 17);
            doc.roundedRect(margin, y, cW, 30, 2, 2, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(17);
            doc.setTextColor(212, 175, 55);
            doc.text('ABHISHREE', pageW / 2, y + 10, { align: 'center' });

            doc.setFontSize(8.5);
            doc.setTextColor(180, 145, 50);
            doc.text('DESIGNERS & FASHION ACADEMY', pageW / 2, y + 17, { align: 'center' });

            doc.setFontSize(7.5);
            doc.setTextColor(150, 150, 150);
            doc.text('Fashion Hub, Main Blvd, Mumbai  |  +91 98765 43210  |  info@abhishredesigners.com', pageW / 2, y + 23, { align: 'center' });

            y += 36;

            // Title banner
            doc.setFillColor(212, 175, 55);
            doc.roundedRect(margin, y, cW, 9, 1.5, 1.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(17, 17, 17);
            doc.text('OFFICIAL ADMISSION CONFIRMATION & FEE SLIP', pageW / 2, y + 6.2, { align: 'center' });
            y += 14;

            // Student info box
            doc.setFillColor(255, 248, 240);
            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(0.4);
            doc.roundedRect(margin, y, cW, 33, 1.5, 1.5, 'FD');

            var lx = margin + 4;
            var vx1 = margin + 48;
            var lx2 = margin + 100;
            var vx2 = margin + 133;

            var rows = [
                ['Registration No:', d.regNo, 'Date:', d.todayDate],
                ['Student Name:', d.formData.name, 'City:', d.formData.city],
                ['Mobile / Phone:', d.formData.phone, 'Email:', d.formData.email]
            ];

            rows.forEach(function (row, i) {
                var ry = y + 10 + (i * 9);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(row[0], lx, ry);
                doc.text(row[2], lx2, ry);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(17, 17, 17);
                doc.text(String(row[1] || '-'), vx1, ry);
                var v2 = String(row[3] || '-');
                doc.text(v2.length > 25 ? v2.substring(0, 25) + '...' : v2, vx2, ry);
            });
            y += 39;

            // Course details box
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(210, 210, 210);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, y, cW, 38, 1.5, 1.5, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(180, 135, 20);
            doc.text('Selected Course & Batch Details', lx, y + 8);
            doc.setDrawColor(230, 230, 230);
            doc.line(lx, y + 10, margin + cW - 4, y + 10);

            var courseRows = [
                ['Selected Course:', d.formData.course_interested],
                ['Course Duration:', d.selectedCourse.duration],
                ['Batch Schedule:', 'Starts ' + d.selectedCourse.batchStart],
                ['Daily Class Timings:', d.selectedCourse.timing]
            ];

            courseRows.forEach(function (row, i) {
                var ry = y + 18 + (i * 6.5);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(90, 90, 90);
                doc.text(row[0], lx, ry);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(17, 17, 17);
                doc.text(String(row[1] || '-'), vx1, ry);
            });
            y += 44;

            // Fee breakdown box
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(210, 210, 210);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, y, cW, 45, 1.5, 1.5, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(180, 135, 20);
            doc.text('Fee Breakdown & Payment Summary', lx, y + 8);
            doc.setDrawColor(230, 230, 230);
            doc.line(lx, y + 10, margin + cW - 4, y + 10);

            var feeRows = [
                { label: 'Total Course Tuition Fee:', value: d.selectedCourse.fee, color: [17, 17, 17] },
                { label: 'Seat Reservation / Reg. Fee:', value: d.selectedCourse.registration, color: [180, 130, 20] },
                { label: 'Payment Mode Available:', value: 'UPI / NetBanking / Debit Card / EMI', color: [60, 60, 60] }
            ];

            feeRows.forEach(function (row, i) {
                var ry = y + 19 + (i * 8.5);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(90, 90, 90);
                doc.text(row.label, lx, ry);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(row.color[0], row.color[1], row.color[2]);
                doc.text(String(row.value), margin + cW - 4, ry, { align: 'right' });

                if (i < 2) {
                    doc.setDrawColor(240, 240, 240);
                    doc.line(lx, ry + 3, margin + cW - 4, ry + 3);
                }
            });

            // Status badge
            var badgeY = y + 34;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(90, 90, 90);
            doc.text('Application Status:', lx, badgeY);
            doc.setFillColor(40, 167, 69);
            doc.roundedRect(margin + cW - 52, badgeY - 5, 48, 7.5, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(7.5);
            doc.text('CONFIRMED & PROCESSED', margin + cW - 28, badgeY, { align: 'center' });

            y += 52;

            // Note footer
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(140, 140, 140);
            doc.text('* Please present this slip or Registration No (' + d.regNo + ') at the academy desk during counselor verification.', pageW / 2, y + 5, { align: 'center', maxWidth: cW });

            // Gold accent line
            doc.setFillColor(212, 175, 55);
            doc.rect(margin, y + 11, cW, 1.2, 'F');

            doc.save('AS_Fashion_Designing_Admission_Slip.pdf');

        } catch (err) {
            console.error('PDF error:', err);
            alert('PDF generation failed: ' + err.message + '\nPlease use the Print Slip button instead.');
        }

        $btn.prop('disabled', false).html(originalText);
    });

    function escapeHtml(text) {
        return $('<div>').text(text).html();
    }
});
