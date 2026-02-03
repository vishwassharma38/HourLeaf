import random

FLOWER_VARIATIONS = ["red", "purple", "green"]

def random_variation():
    return random.choice(FLOWER_VARIATIONS)

def random_seed():
    return random.randint(1, 1_000_000)
