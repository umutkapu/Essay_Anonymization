import * as React from 'react';
import { extendTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import PersonSearch from '@mui/icons-material/PersonSearch';
import DownloadIcon from '@mui/icons-material/Download';

const NAVIGATION = [
    { kind: 'header', title: 'Hakem İşlemleri' },
    { segment: 'referees', title: 'Hakemler', icon: <PersonSearch /> },
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

export default function RefereePanel(props) {
    const { window } = props;
    const router = useDemoRouter('/referees');
    const demoWindow = window ? window() : undefined;

    const [selectedReviewer, setSelectedReviewer] = React.useState(null);
    const [reviewers, setReviewers] = React.useState([]);
    const [assignedEssays, setAssignedEssays] = React.useState([]);
    const [essayComments, setEssayComments] = React.useState({});
    const [essayResults, setEssayResults] = React.useState({});

    React.useEffect(() => {
        if (router.pathname.endsWith('/referees')) {
            fetch('http://localhost:8000/get-reviewer-list/')
                .then(res => res.json())
                .then(data => setReviewers(data));

            fetch('http://localhost:8000/get-assigned-essays/')
                .then(res => res.json())
                .then(data => {
                    console.log("Yönlendirilmiş makaleler:", data);
                    setAssignedEssays(data);
                });
        }
    }, [router.pathname]);

    const selectedReviewerEssays = assignedEssays.filter(
        (essay) => essay.reviewerId === selectedReviewer?.id
    );

    const handleSave = (essayId) => {
        const comment = essayComments[essayId];
        const result = essayResults[essayId];

        if (!comment || !result) {
            alert("Lütfen hem yorum hem de sonucu giriniz.");
            return;
        }

        fetch('http://localhost:8000/save-review/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                article_id: essayId,
                reviewer_id: selectedReviewer.id,
                comment,
                result,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Değerlendirme başarıyla kaydedildi.");

                    // 🔄 Listeyi yeniden al
                    fetch('http://localhost:8000/get-assigned-essays/')
                        .then(res => res.json())
                        .then(data => setAssignedEssays(data))
                        .catch(err => console.error("Makale güncelleme hatası:", err));
                } else {
                    alert("Hata: " + data.message);
                }
            })
            .catch(() => alert("Sunucuya ulaşılamadı."));
    };


    return (
        <AppProvider
            navigation={NAVIGATION}
            router={router}
            theme={demoTheme}
            window={demoWindow}
            branding={{
                title: 'Hakem',
                logo: <img src="/referee.png" alt="Hakem Sayfası" onClick={() => router.navigate('/referee')} />,
            }}
        >
            <DashboardLayout>
                <PageContainer>
                    {router.pathname.endsWith('/referees') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="h6">Hakem Listesi</Typography>
                                <List component={Paper}>
                                    {reviewers.map((reviewer) => (
                                        <ListItem disablePadding key={reviewer.id}>
                                            <ListItemButton onClick={() => setSelectedReviewer(reviewer)}>
                                                <ListItemText primary={reviewer.name} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>

                            <Grid item xs={12} md={8}>
                                {selectedReviewer ? (
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">{selectedReviewer.name}</Typography>
                                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                                Yönlendirilmiş Makaleler:
                                            </Typography>

                                            {selectedReviewerEssays.length > 0 ? (
                                                selectedReviewerEssays.map((essay) => (
                                                    <Paper key={essay.id} sx={{ p: 2, mb: 2 }}>
                                                        <Grid container spacing={1}>
                                                            <Grid item xs={10}>
                                                                <Typography variant="body1"><b>{essay.title}</b></Typography>
                                                            </Grid>
                                                            <Grid item xs={2} textAlign="right">
                                                                {/* 📎 PDF İndirme Butonu */}
                                                                <a
                                                                    href={`http://localhost:8000${essay.anon_pdf}`}
                                                                    download
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    <Button variant="outlined" color="secondary" sx={{ mt: 1 }} startIcon={<DownloadIcon />}>

                                                                    </Button>
                                                                </a>


                                                            </Grid>
                                                        </Grid>

                                                        <TextField
                                                            label="Yorumunuz"
                                                            variant="outlined"
                                                            fullWidth
                                                            multiline
                                                            rows={2}
                                                            value={essayComments[essay.id] || ""}
                                                            onChange={(e) =>
                                                                setEssayComments((prev) => ({
                                                                    ...prev,
                                                                    [essay.id]: e.target.value,
                                                                }))
                                                            }
                                                            sx={{ mt: 1 }}
                                                        />

                                                        <TextField
                                                            label="Sonuç"
                                                            variant="outlined"
                                                            fullWidth
                                                            value={essayResults[essay.id] || ""}
                                                            onChange={(e) =>
                                                                setEssayResults((prev) => ({
                                                                    ...prev,
                                                                    [essay.id]: e.target.value,
                                                                }))
                                                            }
                                                            sx={{ mt: 1 }}
                                                        />

                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            sx={{ mt: 1 }}
                                                            onClick={() => handleSave(essay.id)}
                                                        >
                                                            Değerlendirmeyi Kaydet
                                                        </Button>
                                                    </Paper>

                                                ))
                                            ) : (
                                                <Typography variant="body2">
                                                    Bu hakeme yönlendirilmiş makale yok.
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Typography variant="body1" sx={{ mt: 2 }}>
                                        Bir hakem seçiniz...
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </PageContainer>
            </DashboardLayout>
        </AppProvider>
    );
}
