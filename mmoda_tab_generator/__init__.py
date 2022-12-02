import yaml

class Config:
    def __init__(self, conf_path):
        with open(conf_path, 'r') as fd:
            yamconf = yaml.safe_load(fd)
        self.dispatcher_url = yamconf['dispatcher_url']
        self.instruments_dir_path = yamconf['instruments_dir_path']