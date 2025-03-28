import * as React from 'react';
import { extendTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ArticleIcon from '@mui/icons-material/Article';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoFixHigh from '@mui/icons-material/AutoFixHigh';
import MessageIcon from '@mui/icons-material/Message';

const NAVIGATION = [
    { kind: 'header', title: 'Editor' },
    { segment: 'essays', title: 'Makaleler', icon: <ArticleIcon /> },
    { segment: 'orientation', title: 'Makale Yönlendirme', icon: <ArrowForwardIcon /> },
    { segment: 'anonymization', title: 'Anonimleştirme', icon: <AutoFixHigh /> },
    { segment: 'my_messages', title: 'Mesajlarım', icon: <MessageIcon /> },
];

const demoTheme = extendTheme({
    colorSchemes: { light: true, dark: true },
    colorSchemeSelector: 'class',
    breakpoints: { values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 } },
});

function useDemoRouter(initialPath) {
    const [pathname, setPathname] = React.useState(initialPath);
    return React.useMemo(() => ({
        pathname,
        searchParams: new URLSearchParams(),
        navigate: (path) => setPathname(String(path)),
    }), [pathname]);
}

export default function EssayInquery(props) {
    const { window } = props;
    const router = useDemoRouter('/essays');
    const demoWindow = window ? window() : undefined;

    // Makale ve hakem verileri
    const [essays, setEssays] = React.useState([]);
    const [reviewers, setReviewers] = React.useState([]);
    const [selectedReviewers, setSelectedReviewers] = React.useState({});


    const [reviewersByEssay, setReviewersByEssay] = React.useState({}); // 📌 Her makale için hakem listesi

    // Makaleleri çek
    React.useEffect(() => {
        if (router.pathname.endsWith('/orientation')) {
            fetch("http://localhost:8000/get-articles/")
                .then((res) => res.json())
                .then((data) => setEssays(data));
        }
    }, [router.pathname]);

    // Her makale için uygun hakemleri çek
    React.useEffect(() => {
        if (router.pathname.endsWith('/orientation')) {
            essays
                .filter(e => e.status === "Anonimleştirilmiş")
                .forEach(essay => {
                    fetch(`http://localhost:8000/get-reviewers/${essay.id}/`)
                        .then(res => res.json())
                        .then(data => {
                            setReviewersByEssay(prev => ({
                                ...prev,
                                [essay.id]: data
                            }));
                        });
                });
        }
    }, [essays, router.pathname]);

    const [messages, setMessages] = React.useState([]);


    React.useEffect(() => {
        if (router.pathname.endsWith('/my_messages')) {
            fetch('http://localhost:8000/get-messages/')
                .then((res) => res.json())
                .then((data) => setMessages(data))
                .catch((err) => console.error('Mesajlar alınamadı:', err));
        }
    }, [router.pathname]);

    React.useEffect(() => {
        if (router.pathname.endsWith('/essays')) {
            fetch('http://localhost:8000/get-articles/')
                .then((res) => res.json())
                .then((data) => setEssays(data))
                .catch((err) => console.error("Makaleler alınamadı:", err));
        }
    }, [router.pathname]);

    const handleAssign = (essay) => {
        const selected = selectedReviewers[essay.id];
        if (!selected) {
            alert("Lütfen hakem seçin!");
            return;
        }

        fetch("http://localhost:8000/assign-reviewer/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                article_id: essay.id,
                reviewer_name: selected
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Makale başarıyla yönlendirildi.");
                    setEssays(prev => prev.filter(e => e.id !== essay.id));
                } else {
                    alert("Yönlendirme hatası: " + data.error);
                }
            })
            .catch(err => {
                console.error("İstek hatası:", err);
                alert("Sunucuya ulaşılamadı.");
            });
    };



    return (
        <AppProvider
            navigation={NAVIGATION}
            router={router}
            theme={demoTheme}
            window={demoWindow}
            branding={{
                title: 'Editör',
                logo: <img src="/editor.png" alt="Editor" onClick={() => router.navigate('/editor')} />,
            }}
        >
            <DashboardLayout>
                <PageContainer>

                    {/* 📌 Makale Listesi Segmenti */}
                    {router.pathname.endsWith('/essays') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            <Grid item xs={12}>
                                <h2>Makaleler</h2>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>ID</b></TableCell>
                                                <TableCell><b>Başlık</b></TableCell>
                                                <TableCell><b>Yazar</b></TableCell>
                                                <TableCell><b>Tarih</b></TableCell>
                                                <TableCell><b>Durumu</b></TableCell>
                                                <TableCell><b>İşlem</b></TableCell>
                                                <TableCell><b>İndir</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {essays.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7}>Henüz makale yüklenmemiş.</TableCell>
                                                </TableRow>
                                            ) : (
                                                essays.map((essay) => (
                                                    <TableRow key={essay.id}>
                                                        <TableCell>{essay.id}</TableCell>
                                                        <TableCell>{essay.title}</TableCell>
                                                        <TableCell>{essay.author}</TableCell>
                                                        <TableCell>{essay.date}</TableCell>
                                                        <TableCell style={{
                                                            color:
                                                                essay.status === "Yayında" ? "green" :
                                                                    essay.status === "Anonimleştirilmemiş" ? "red" :
                                                                        essay.status === "Yönlendirildi" ? "orange" :
                                                                            "black"
                                                        }}>
                                                            {essay.status}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() => {
                                                                    fetch(`http://localhost:8000/get-review-for-article/${essay.id}/`)
                                                                        .then(res => res.json())
                                                                        .then(data => {
                                                                            if (data.comment) {
                                                                                alert(`📝 Hakem: ${data.reviewer}\n\nYorum: ${data.comment}\nSonuç: ${data.result}\nTarih: ${data.timestamp}`);
                                                                            } else {
                                                                                alert("Bu makale için henüz değerlendirme yapılmamış.");
                                                                            }
                                                                        })
                                                                        .catch(() => {
                                                                            alert("Hakem değerlendirmesi alınamadı.");
                                                                        });
                                                                }}
                                                            >
                                                                Görüntüle
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="contained"
                                                                color='dark'
                                                                startIcon={<DownloadIcon />}
                                                                onClick={() =>
                                                                    window.open(`http://localhost:8000/media/uploads/${essay.title}`, '_blank')
                                                                }
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}


                    {/* 📌 Makale Yönlendirme Segmenti */}
                    {router.pathname.endsWith('/orientation') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            <Grid item xs={12}>
                                <h2>Makale Yönlendirme</h2>
                                <TableContainer component={Paper} sx={{ mb: 5 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>ID</b></TableCell>
                                                <TableCell><b>Başlık</b></TableCell>
                                                <TableCell><b>Konu</b></TableCell>
                                                <TableCell><b>Hakem Seç</b></TableCell>
                                                <TableCell><b>Yönlendir</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {essays.filter(e => e.status === "Anonimleştirilmiş").map(essay => (
                                                <TableRow key={essay.id}>
                                                    <TableCell>{essay.id}</TableCell>
                                                    <TableCell>{essay.title}</TableCell>
                                                    <TableCell>{essay.konu}</TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={selectedReviewers[essay.id] || ""}
                                                            onChange={(e) => setSelectedReviewers(prev => ({ ...prev, [essay.id]: e.target.value }))}
                                                            fullWidth
                                                            displayEmpty
                                                        >
                                                            <MenuItem value="" disabled>Hakem Seç</MenuItem>
                                                            {(reviewersByEssay[essay.id] || []).map(rev => (
                                                                <MenuItem key={rev.id} value={rev.name}>
                                                                    {rev.name} - {rev.alan}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="contained" color="primary" onClick={() => handleAssign(essay)}>
                                                            Gönder
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <h2>📥 Değerlendirilmiş Makaleler</h2>
                                <TableContainer component={Paper} sx={{ mb: 4 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>ID</b></TableCell>
                                                <TableCell><b>Başlık</b></TableCell>
                                                <TableCell><b>Yazar</b></TableCell>
                                                <TableCell><b>PDF</b></TableCell>
                                                <TableCell><b>Gönder</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {essays.filter(e => e.status === "Değerlendirildi").map((essay) => (
                                                <TableRow key={essay.id}>
                                                    <TableCell>{essay.id}</TableCell>
                                                    <TableCell>{essay.title}</TableCell>
                                                    <TableCell>{essay.author}</TableCell>
                                                    <TableCell>
                                                        <a
                                                            href={`http://localhost:8000/media/${essay.degerlendirilmis_pdf}`}
                                                            download
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <Button variant="outlined" color="secondary">
                                                                İndir
                                                            </Button>
                                                        </a>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={() => {
                                                                fetch("http://localhost:8000/send-reviewed-to-author/", {
                                                                    method: "POST",
                                                                    headers: {
                                                                        "Content-Type": "application/json",
                                                                    },
                                                                    body: JSON.stringify({ article_id: essay.id }),
                                                                })
                                                                    .then(res => res.json())
                                                                    .then(data => {
                                                                        if (data.success) {
                                                                            alert("Makale yazara gönderildi.");
                                                                        } else {
                                                                            alert("Hata: " + data.message);
                                                                        }
                                                                    });
                                                            }}
                                                        >
                                                            Gönder
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}



                    {router.pathname.endsWith('/anonymization') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            <Grid item xs={12}>
                                <h2>Anonimleştirme</h2>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>ID</b></TableCell>
                                                <TableCell><b>Başlık</b></TableCell>
                                                <TableCell><b>Yazar</b></TableCell>
                                                <TableCell><b>Tarih</b></TableCell>
                                                <TableCell><b>Durumu</b></TableCell>
                                                <TableCell><b>İşlem</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {essays
                                                .filter((essay) => essay.status === "Anonimleştirilmemiş")
                                                .map((essay) => (
                                                    <TableRow key={essay.id}>
                                                        <TableCell>{essay.id}</TableCell>
                                                        <TableCell>{essay.title}</TableCell>
                                                        <TableCell>{essay.author}</TableCell>
                                                        <TableCell>{essay.date}</TableCell>
                                                        <TableCell>{essay.status}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="contained"
                                                                color="secondary"
                                                                onClick={() => {
                                                                    fetch(`http://localhost:8000/anonimlestir/${essay.id}/`, {
                                                                        method: "POST",
                                                                    })
                                                                        .then(res => res.json())
                                                                        .then(data => {
                                                                            if (data.success) {
                                                                                alert(`Makale "${essay.title}" anonimleştirildi.`);
                                                                                setEssays(prev =>
                                                                                    prev.map(e => e.id === essay.id ? { ...e, status: "Anonimleştirilmiş" } : e)
                                                                                );
                                                                            } else {
                                                                                alert("Anonimleştirme başarısız: " + data.error);
                                                                            }
                                                                        })
                                                                        .catch(err => {
                                                                            console.error("Anonimleştirme hatası:", err);
                                                                            alert("Sunucuya ulaşılamadı.");
                                                                        });
                                                                }}
                                                            >
                                                                Anonimleştir
                                                            </Button>

                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}

                    {router.pathname.endsWith('/my_messages') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            <Grid item xs={12}>
                                <h2>Mesajlarım</h2>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>ID</b></TableCell>
                                                <TableCell><b>Gönderen</b></TableCell>
                                                <TableCell><b>İçerik</b></TableCell>
                                                <TableCell><b>Tarih</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {messages.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4}>Hiç mesaj bulunamadı.</TableCell>
                                                </TableRow>
                                            ) : (
                                                messages.map((msg) => (
                                                    <TableRow key={msg.id}>
                                                        <TableCell>{msg.id}</TableCell>
                                                        <TableCell>{msg.sender_email}</TableCell>
                                                        <TableCell>{msg.content}</TableCell>
                                                        <TableCell>{msg.timestamp}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}


                </PageContainer>
            </DashboardLayout>
        </AppProvider>
    );
}
