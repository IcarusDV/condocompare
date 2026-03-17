#!/usr/bin/env python3
"""
Script para gerar um PDF de teste com dados de condominio
para testar a funcionalidade de extracao automatica.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from datetime import datetime, timedelta
import os

def generate_test_pdf():
    """Gera um PDF de teste simulando uma apolice de seguro de condominio"""

    # Caminho do arquivo
    output_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(output_dir, "test_data", "apolice_teste.pdf")

    # Criar diretorio se nao existir
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Criar documento
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        alignment=1  # Center
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
        spaceBefore=15,
        textColor=colors.darkblue
    )
    normal_style = styles['Normal']

    # Conteudo
    story = []

    # Cabecalho
    story.append(Paragraph("SEGURADORA BRASIL SEGUROS S.A.", title_style))
    story.append(Paragraph("APOLICE DE SEGURO CONDOMINIO", title_style))
    story.append(Spacer(1, 20))

    # Numero da apolice
    story.append(Paragraph(f"<b>Numero da Apolice:</b> 2024.001.987654", normal_style))
    story.append(Spacer(1, 10))

    # Dados do Segurado (Condominio)
    story.append(Paragraph("DADOS DO SEGURADO", heading_style))

    dados_condominio = [
        ["Nome:", "Condominio Residencial Solar das Palmeiras"],
        ["CNPJ:", "12.345.678/0001-90"],
        ["Endereco:", "Rua das Flores, 500"],
        ["Complemento:", "Blocos A, B e C"],
        ["Bairro:", "Jardim das Americas"],
        ["Cidade:", "Sao Paulo"],
        ["Estado:", "SP"],
        ["CEP:", "01234-567"],
    ]

    table = Table(dados_condominio, colWidths=[4*cm, 12*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(table)
    story.append(Spacer(1, 15))

    # Caracteristicas do Imovel
    story.append(Paragraph("CARACTERISTICAS DO IMOVEL", heading_style))

    caracteristicas = [
        ["Area Construida:", "8.500 m2"],
        ["Numero de Unidades:", "120 apartamentos"],
        ["Numero de Blocos:", "3 blocos"],
        ["Numero de Andares:", "15 andares por bloco"],
        ["Tipo de Construcao:", "Residencial"],
        ["Ano de Construcao:", "2015"],
    ]

    table2 = Table(caracteristicas, colWidths=[4*cm, 12*cm])
    table2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(table2)
    story.append(Spacer(1, 15))

    # Vigencia
    story.append(Paragraph("VIGENCIA DA APOLICE", heading_style))

    data_inicio = datetime.now()
    data_fim = data_inicio + timedelta(days=365)

    vigencia = [
        ["Inicio da Vigencia:", data_inicio.strftime("%d/%m/%Y")],
        ["Fim da Vigencia:", data_fim.strftime("%d/%m/%Y")],
        ["Vencimento:", data_fim.strftime("%Y-%m-%d")],
    ]

    table3 = Table(vigencia, colWidths=[4*cm, 12*cm])
    table3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(table3)
    story.append(Spacer(1, 15))

    # Coberturas
    story.append(Paragraph("COBERTURAS CONTRATADAS", heading_style))

    coberturas = [
        ["Cobertura", "Limite (R$)", "Franquia (R$)"],
        ["Incendio, Raio e Explosao", "15.000.000,00", "Sem Franquia"],
        ["Danos Eletricos", "500.000,00", "1.500,00"],
        ["Vendaval e Granizo", "1.000.000,00", "2.000,00"],
        ["Responsabilidade Civil", "500.000,00", "1.000,00"],
        ["Quebra de Vidros", "100.000,00", "500,00"],
        ["Roubo de Bens", "200.000,00", "1.000,00"],
    ]

    table4 = Table(coberturas, colWidths=[8*cm, 4*cm, 4*cm])
    table4.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    story.append(table4)
    story.append(Spacer(1, 15))

    # Valor do Premio
    story.append(Paragraph("VALOR DO PREMIO", heading_style))

    premio = [
        ["Premio Anual:", "R$ 45.000,00"],
        ["Forma de Pagamento:", "12x de R$ 3.750,00 sem juros"],
        ["Desconto Aplicado:", "5%"],
    ]

    table5 = Table(premio, colWidths=[4*cm, 12*cm])
    table5.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(table5)
    story.append(Spacer(1, 20))

    # Rodape
    story.append(Paragraph(
        f"<i>Documento gerado para fins de teste em {datetime.now().strftime('%d/%m/%Y %H:%M')}</i>",
        ParagraphStyle('Footer', parent=normal_style, fontSize=8, textColor=colors.grey)
    ))

    # Gerar PDF
    doc.build(story)

    print(f"PDF gerado com sucesso: {output_path}")
    return output_path


if __name__ == "__main__":
    generate_test_pdf()
