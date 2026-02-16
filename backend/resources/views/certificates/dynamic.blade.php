<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sertifika</title>
    <style>
        @page {
            margin: 0px;
        }
        body { 
            font-family: 'DejaVu Sans', sans-serif; 
            margin: 0; 
            padding: 0; 
            width: 100%; 
            height: 100%;
        }
        .page-container {
            position: relative;
            width: {{ $width }}px;
            height: {{ $height }}px;
            overflow: hidden;
        }
        .background-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            /* 
               DomPDF support for object-fit is non-existent.
               We have to handle fit manually via CSS or accept stretch (100% 100%) as default.
               For 'contain' or 'cover', standard HTML/CSS tricks are needed but might fail in DomPDF.
               
               However, if user selects 'stretch' or 'fill', width/height 100% works best.
               If user selects 'contain', object-fit: contain might be ignored.
               Lets try to support basic fit.
            */
            @if(isset($config['backgroundMode']) && $config['backgroundMode'] == 'contain')
                object-fit: contain;
            @elseif(isset($config['backgroundMode']) && $config['backgroundMode'] == 'cover')
                object-fit: cover;
            @else
                /* Default to stretch/fill which is usually desired for certifications */
                /* No object-fit ensures it stretches to container */
            @endif
        }
        .element {
            position: absolute;
            white-space: nowrap;
            /* DomPDF has poor transform support, removed vertical centering */
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
                    $content = $certificate->training_program->name;
                    break;
                case 'qr_code':
                    $content = '<img src="data:image/svg+xml;base64,'.$qrCode.'" width="'.($element['width'] ?? 100).'" height="'.($element['height'] ?? 100).'">';
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
            font-family: {{ $element['font_family'] ?? 'DejaVu Sans' }};
        ">
            {!! $content !!}
        </div>
    @endforeach
    </div>
</body>
</html>
