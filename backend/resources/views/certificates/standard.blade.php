<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sertifika</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; text-align: center; border: 10px solid #ddd; padding: 20px; height: 90%; }
        .header { font-size: 40px; font-weight: bold; margin-bottom: 20px; color: #333; }
        .sub-header { font-size: 20px; margin-bottom: 10px; }
        .student-name { font-size: 32px; font-weight: bold; margin: 30px 0; color: #000; text-transform: uppercase; border-bottom: 2px solid #ccc; display: inline-block; padding-bottom: 5px; }
        .course-name { font-size: 24px; color: #555; margin-bottom: 20px; }
        .date { margin-top: 40px; font-size: 16px; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 50px; }
        .signature { border-top: 1px solid #333; padding-top: 10px; width: 200px; margin: 0 auto; margin-top: 40px;}
        .qr { position: absolute; bottom: 30px; right: 30px; }
    </style>
</head>
<body>
    <div style="padding: 20px; border: 2px solid #333; height: 100%;">
        <div class="header">BAŞARI SERTİFİKASI</div>
        
        <div class="sub-header">Bu sertifika, aşağıda bilgileri bulunan kişinin</div>
        
        <div class="student-name">
            {{ $certificate->student->first_name }} {{ $certificate->student->last_name }}
        </div>
        
        <div class="sub-header">başarıyla tamamladığı eğitim programı:</div>
        
        <div class="course-name">
            {{ $certificate->training_program->name }}
        </div>
        
        <div>
            Eğitim Süresi: {{ $certificate->training_program->duration_hours }} Saat
        </div>

        <div class="date">
            Düzenlenme Tarihi: {{ \Carbon\Carbon::parse($certificate->issue_date)->format('d.m.Y') }} <br>
            Sertifika No: {{ $certificate->certificate_no }}
        </div>

        <div class="signature">
            Yetkili İmza <br>
            360Cert Akademi
        </div>

        <div class="qr">
            <img src="data:image/svg+xml;base64,{{ $qrCode }}" alt="QR Code" width="100">
        </div>
    </div>
</body>
</html>
