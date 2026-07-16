import { Circle, Document, Page, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { PdfBlock, PdfDocumentData } from "./types";

const COLOR = {
  primary: "#081C3A",
  navyDeep: "#050f22",
  accent: "#25D0C3",
  secondary: "#1F5EFF",
  muted: "#5A6B85",
  border: "#E7EDF5",
  surface: "#F7FAFC",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: COLOR.primary,
    padding: "50 46",
  },
  darkPage: {
    fontFamily: "Helvetica",
    backgroundColor: COLOR.primary,
    color: COLOR.white,
    padding: "50 46",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    borderBottom: `0.8 solid ${COLOR.border}`,
    paddingBottom: 12,
  },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: COLOR.primary },
  brandDot: { color: COLOR.accent },
  headerCat: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLOR.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 46,
    right: 46,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLOR.muted,
  },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 20, marginBottom: 14, color: COLOR.primary },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 8, color: COLOR.primary },
  p: { fontSize: 10.5, lineHeight: 1.6, color: "#33415C", marginBottom: 10 },
  bulletRow: { flexDirection: "row", marginBottom: 7, alignItems: "flex-start" },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLOR.accent,
    marginTop: 4,
    marginRight: 8,
  },
  bulletText: { fontSize: 10.5, lineHeight: 1.5, color: "#33415C", flex: 1 },
});

function Header({ category, chapter }: { category: string; chapter?: string }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.brand}>
        Brusync<Text style={styles.brandDot}>.</Text>
      </Text>
      <Text style={styles.headerCat}>
        {category}
        {chapter ? ` · ${chapter}` : ""}
      </Text>
    </View>
  );
}

function Footer({ page }: { page: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text>brusync.com.br</Text>
      <Text>{String(page).padStart(2, "0")}</Text>
    </View>
  );
}

function CoverPage({
  category,
  title,
  subtitle,
}: {
  category: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Page size="A4" style={styles.darkPage}>
      <Svg style={{ position: "absolute", top: 0, left: 0 }} width={503} height={740}>
        <Circle cx={480} cy={90} r={170} fill={COLOR.secondary} opacity={0.28} />
        <Circle cx={40} cy={760} r={150} fill={COLOR.accent} opacity={0.22} />
      </Svg>
      <View style={{ position: "absolute", top: 50, left: 46 }}>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14, color: COLOR.white }}>
          Brusync<Text style={{ color: COLOR.accent }}>.</Text>
        </Text>
      </View>
      <View style={{ position: "absolute", left: 46, right: 46, top: 330 }}>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "rgba(37,208,195,0.16)",
            borderColor: COLOR.accent,
            borderWidth: 0.8,
            borderRadius: 20,
            paddingVertical: 6,
            paddingHorizontal: 14,
            marginBottom: 18,
          }}
        >
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: COLOR.accent }}>
            {category}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 30,
            lineHeight: 1.2,
            color: COLOR.white,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 12.5, color: "#B9C6DC", marginTop: 16, lineHeight: 1.5 }}>
          {subtitle}
        </Text>
      </View>
      <View style={{ position: "absolute", bottom: 46, left: 46, right: 46 }}>
        <View style={{ borderTop: "0.8 solid rgba(255,255,255,0.14)", paddingTop: 14 }}>
          <Text style={{ fontSize: 8.5, color: "#8494AE" }}>
            brusync.com.br · admin@brusync.com.br
          </Text>
        </View>
      </View>
    </Page>
  );
}

function TocPage({ entries, page }: { entries: { title: string; page: number }[]; page: number }) {
  return (
    <Page size="A4" style={styles.page}>
      <Header category="Índice" />
      <Text style={styles.h1}>Índice</Text>
      <View style={{ marginTop: 10 }}>
        {entries.map((entry) => (
          <View
            key={entry.title}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 9,
              borderBottom: `0.6 solid ${COLOR.border}`,
            }}
          >
            <Text style={{ fontSize: 11, color: COLOR.primary }}>{entry.title}</Text>
            <Text style={{ fontSize: 11, color: COLOR.muted }}>
              {String(entry.page).padStart(2, "0")}
            </Text>
          </View>
        ))}
      </View>
      <Footer page={page} />
    </Page>
  );
}

function DividerPage({
  number,
  title,
  intro,
  page,
}: {
  number: string;
  title: string;
  intro: string;
  page: number;
}) {
  return (
    <Page size="A4" style={styles.darkPage}>
      <Svg style={{ position: "absolute", top: 0, left: 0 }} width={503} height={740}>
        <Circle cx={520} cy={760} r={190} fill={COLOR.accent} opacity={0.18} />
      </Svg>
      <View style={{ flex: 1, justifyContent: "center", paddingLeft: 4 }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: "Helvetica-Bold",
            color: COLOR.accent,
            marginBottom: 14,
          }}
        >
          CAPÍTULO {number}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 26,
            color: COLOR.white,
            lineHeight: 1.25,
            maxWidth: 400,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 11.5,
            color: "#B9C6DC",
            marginTop: 18,
            lineHeight: 1.6,
            maxWidth: 380,
          }}
        >
          {intro}
        </Text>
      </View>
      <Footer page={page} />
    </Page>
  );
}

function ContentPage({
  heading,
  paragraphs,
  bullets,
  category,
  page,
}: {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  category: string;
  page: number;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <Header category={category} />
      <Text style={styles.h1}>{heading}</Text>
      {paragraphs.map((p) => (
        <Text style={styles.p} key={p}>
          {p}
        </Text>
      ))}
      {bullets && (
        <View style={{ marginTop: 6 }}>
          {bullets.map((b) => (
            <View style={styles.bulletRow} key={b}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}
      <Footer page={page} />
    </Page>
  );
}

function StatPage({
  heading,
  items,
  category,
  page,
}: {
  heading: string;
  items: { value: string; label: string }[];
  category: string;
  page: number;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <Header category={category} />
      <Text style={styles.h2}>{heading}</Text>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
          {items.map((item) => (
            <View
              key={item.label}
              style={{
                width: items.length > 2 ? "46%" : "100%",
                backgroundColor: COLOR.surface,
                borderRadius: 10,
                padding: 18,
                borderColor: COLOR.border,
                borderWidth: 0.8,
              }}
            >
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 26, color: COLOR.primary }}>
                {item.value}
              </Text>
              <Text style={{ fontSize: 9.5, color: COLOR.muted, marginTop: 6 }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <Footer page={page} />
    </Page>
  );
}

function ChecklistPage({
  heading,
  intro,
  items,
  category,
  page,
}: {
  heading: string;
  intro?: string;
  items: string[];
  category: string;
  page: number;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <Header category={category} />
      <Text style={styles.h1}>{heading}</Text>
      {intro && <Text style={styles.p}>{intro}</Text>}
      <View style={{ marginTop: 8 }}>
        {items.map((item) => (
          <View
            key={item}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 9,
              borderBottom: `0.6 solid ${COLOR.border}`,
            }}
          >
            <Svg width={13} height={13} style={{ marginRight: 10 }}>
              <Rect
                x={0.5}
                y={0.5}
                width={12}
                height={12}
                rx={3}
                stroke={COLOR.accent}
                strokeWidth={1.2}
                fill="none"
              />
            </Svg>
            <Text style={{ fontSize: 10.5, color: "#33415C", flex: 1 }}>{item}</Text>
          </View>
        ))}
      </View>
      <Footer page={page} />
    </Page>
  );
}

function QuotePage({
  text,
  author,
  category,
  page,
}: {
  text: string;
  author: string;
  category: string;
  page: number;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <Header category={category} />
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ borderLeft: `2.5 solid ${COLOR.accent}`, paddingLeft: 20 }}>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 17,
              lineHeight: 1.5,
              color: COLOR.primary,
            }}
          >
            "{text}"
          </Text>
          <Text style={{ fontSize: 10, color: COLOR.muted, marginTop: 16 }}>{author}</Text>
        </View>
      </View>
      <Footer page={page} />
    </Page>
  );
}

function FlowPage({
  heading,
  steps,
  category,
  page,
}: {
  heading: string;
  steps: string[];
  category: string;
  page: number;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <Header category={category} />
      <Text style={styles.h1}>{heading}</Text>
      <View style={{ marginTop: 14 }}>
        {steps.map((step, idx) => (
          <View key={step}>
            <View
              style={{
                backgroundColor: COLOR.surface,
                borderColor: COLOR.border,
                borderWidth: 0.8,
                borderRadius: 10,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: COLOR.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 9.5, color: COLOR.white, fontFamily: "Helvetica-Bold" }}>
                  {idx + 1}
                </Text>
              </View>
              <Text style={{ fontSize: 10.5, color: "#33415C", flex: 1 }}>{step}</Text>
            </View>
            {idx < steps.length - 1 && (
              <View style={{ alignItems: "center", paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, color: COLOR.accent }}>↓</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      <Footer page={page} />
    </Page>
  );
}

function ChartPage({
  heading,
  caption,
  bars,
  category,
  page,
}: {
  heading: string;
  caption: string;
  bars: { label: string; value: number }[];
  category: string;
  page: number;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const chartW = 420;
  const chartH = 200;
  const barW = chartW / bars.length - 18;
  return (
    <Page size="A4" style={styles.page}>
      <Header category={category} />
      <Text style={styles.h1}>{heading}</Text>
      <Text style={styles.p}>{caption}</Text>
      <View style={{ marginTop: 20, alignItems: "center" }}>
        <Svg width={chartW} height={chartH + 24}>
          {bars.map((bar, i) => {
            const h = (bar.value / max) * chartH;
            const x = i * (chartW / bars.length) + 9;
            return (
              <Rect
                key={bar.label}
                x={x}
                y={chartH - h}
                width={barW}
                height={h}
                rx={4}
                fill={i % 2 === 0 ? COLOR.secondary : COLOR.accent}
              />
            );
          })}
        </Svg>
        <View style={{ flexDirection: "row", width: chartW, marginTop: 6 }}>
          {bars.map((bar) => (
            <Text
              key={bar.label}
              style={{
                fontSize: 8,
                color: COLOR.muted,
                width: chartW / bars.length,
                textAlign: "center",
              }}
            >
              {bar.label}
            </Text>
          ))}
        </View>
      </View>
      <Footer page={page} />
    </Page>
  );
}

function ClosingPage({ heading, text }: { heading: string; text: string }) {
  return (
    <Page size="A4" style={styles.darkPage}>
      <Svg style={{ position: "absolute", top: 0, left: 0 }} width={503} height={740}>
        <Circle cx={300} cy={420} r={220} fill={COLOR.secondary} opacity={0.16} />
      </Svg>
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 60 }}
      >
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 15,
            color: COLOR.white,
            marginBottom: 4,
          }}
        >
          Brusync<Text style={{ color: COLOR.accent }}>.</Text>
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 22,
            color: COLOR.white,
            textAlign: "center",
            marginTop: 26,
            lineHeight: 1.3,
          }}
        >
          {heading}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: "#B9C6DC",
            textAlign: "center",
            marginTop: 14,
            lineHeight: 1.6,
          }}
        >
          {text}
        </Text>
        <View
          style={{
            marginTop: 26,
            backgroundColor: COLOR.accent,
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 22,
          }}
        >
          <Text style={{ fontSize: 10.5, fontFamily: "Helvetica-Bold", color: COLOR.primary }}>
            brusync.com.br
          </Text>
        </View>
      </View>
    </Page>
  );
}

export function PdfDocument({ data }: { data: PdfDocumentData }) {
  let pageCounter = 0;

  function renderBlock(block: PdfBlock, index: number) {
    if (block.type === "cover") {
      return (
        <CoverPage
          key={index}
          category={block.category}
          title={block.title}
          subtitle={block.subtitle}
        />
      );
    }
    pageCounter += 1;
    const page = pageCounter;
    switch (block.type) {
      case "toc":
        return <TocPage key={index} entries={block.entries} page={page} />;
      case "divider":
        return (
          <DividerPage
            key={index}
            number={block.number}
            title={block.title}
            intro={block.intro}
            page={page}
          />
        );
      case "content":
        return (
          <ContentPage
            key={index}
            heading={block.heading}
            paragraphs={block.paragraphs}
            bullets={block.bullets}
            category={data.category}
            page={page}
          />
        );
      case "stat":
        return (
          <StatPage
            key={index}
            heading={block.heading}
            items={block.items}
            category={data.category}
            page={page}
          />
        );
      case "checklist":
        return (
          <ChecklistPage
            key={index}
            heading={block.heading}
            intro={block.intro}
            items={block.items}
            category={data.category}
            page={page}
          />
        );
      case "quote":
        return (
          <QuotePage
            key={index}
            text={block.text}
            author={block.author}
            category={data.category}
            page={page}
          />
        );
      case "flow":
        return (
          <FlowPage
            key={index}
            heading={block.heading}
            steps={block.steps}
            category={data.category}
            page={page}
          />
        );
      case "chart":
        return (
          <ChartPage
            key={index}
            heading={block.heading}
            caption={block.caption}
            bars={block.bars}
            category={data.category}
            page={page}
          />
        );
      case "closing":
        return <ClosingPage key={index} heading={block.heading} text={block.text} />;
      default:
        return null;
    }
  }

  return (
    <Document title={data.title}>{data.blocks.map((block, i) => renderBlock(block, i))}</Document>
  );
}
