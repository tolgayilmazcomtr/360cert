<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sertifika</title>
    <style>
        @foreach(collect($config['elements'])->pluck('font_family')->unique()->filter() as $font)
            @if($font != 'Arial' && $font != 'DejaVu Sans')
                @import url('https://fonts.googleapis.com/css2?family={{ urlencode($font) }}:ital,wght@0,400;0,700;1,400&display=swap');
            @endif
        @endforeach

        @page {
            margin: 0px;
            padding: 0px;
        }
        body { 
            font-family: 'DejaVu Sans', sans-serif; 
            margin: 0px; 
            padding: 0px; 
            width: 100%; 
            height: 100%;
        }
        .page-container {
            position: relative;
            width: {{ $width }}px;
            height: {{ $height }}px;
            overflow: hidden;
            margin: 0;
            padding: 0;
        }
        .background-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: {{ $width }}px;
            height: {{ $height }}px;
            z-index: -1;
            margin: 0;
            padding: 0;
        }
        .element {
            position: absolute;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <img src="{{ $bgImage }}" class="background-layer" />
        @foreach($config['elements'] as $element)
        @php
            $content = '';
            switch($element['type']) {
                case 'student_name':
                    $content = $certificate->student->first_name . ' ' . $certificate->student->last_name;
                    break;
                case 'certificate_no':
                    $content = $certificate->certificate_no;
                    break;
                case 'issue_date':
                    $content = \Carbon\Carbon::parse($certificate->issue_date)->format('d.m.Y');
                    break;
                case 'training_name':
                    // Eski sistem geri uyumluluk: JSON ise 'tr' key'ine bak, yoksa direkt bas
                    $nameData = $certificate->training_program->name;
                    if (is_array($nameData)) {
                        $content = $nameData['tr'] ?? current($nameData) ?? '';
                    } else {
                        $content = $nameData;
                    }
                    break;
                case (preg_match('/^training_name_(.+)$/', $element['type'], $matches) ? true : false):
                    // Yeni sistem: training_name_en, training_name_de vb.
                    $langCode = $matches[1];
                    $nameData = $certificate->training_program->name;
                    if (is_array($nameData)) {
                        $content = $nameData[$langCode] ?? $nameData['tr'] ?? current($nameData) ?? '';
                    } else {
                        $content = $nameData; // Yedek
                    }
                    break;
                case 'qr_code':
                    $w = $element['width'] ?? 100;
                    $h = $element['height'] ?? 100;
                    $content = '<img src="data:image/svg+xml;base64,'.$qrCode.'" style="width: '.$w.'px; height: '.$h.'px; display: block;">';
                    break;
                default:
                    $content = $element['label'] ?? '';
            }
        @endphp

        <div class="element" style="
            left: {{ $element['x'] }}px; 
            top: {{ $element['y'] }}px; 
            font-size: {{ $element['font_size'] ?? 14 }}px; 
            color: {{ $element['color'] ?? '#000000' }};
            font-family: '{{ $element['font_family'] ?? 'DejaVu Sans' }}', sans-serif;
        ">
            {!! $content !!}
        </div>
    @endforeach
    </div>
</body>
</html>
